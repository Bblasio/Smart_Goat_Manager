# pages/Dashboard.py
import streamlit as st
import pandas as pd
import plotly.express as px
from datetime import datetime, date
import feedparser

# -------------------- Page config --------------------
st.set_page_config(page_title="Dashboard", page_icon="chart", layout="wide")

# -------------------- Authentication guard --------------------
if "authenticated" not in st.session_state or not st.session_state.authenticated:
    st.warning("Please log in to view your dashboard.")
    st.stop()

# -------------------- Get user & token from session --------------------
user = st.session_state.user
uid = user["localId"]
id_token = user["idToken"]

# Use pyrebase from parent app (already initialized in app.py)
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app import db  # Import db from main app

# -------------------- Helper: Parse dates --------------------
def try_parse_date(s):
    if not s or not isinstance(s, str):
        return None
    for fmt in ("%Y-%m-%d", "%Y/%m/%d", "%d-%m-%Y", "%d/%m/%Y"):
        try:
            return datetime.strptime(s, fmt).date()
        except:
            continue
    try:
        return datetime.fromisoformat(s.split("T")[0]).date()
    except:
        return None

# -------------------- Normalize breeding records --------------------
def normalize_breeding_records(raw):
    out = []
    if not raw:
        return out
    items = raw.items() if isinstance(raw, dict) else enumerate(raw or [])
    for rec_id, rec in items:
        if not rec or not isinstance(rec, dict):
            continue

        # Find due date
        due_keys = ["expected_due_date", "Expected Due Date", "expectedBirthDate", "due_date", "dueDate"]
        due_str = next((str(rec[k]) for k in due_keys if k in rec and rec[k]), None)

        # If no due, estimate from breeding date + 150 days
        if not due_str:
            breed_keys = ["breeding_date", "Breeding Date", "mating_date"]
            bd_str = next((str(rec[k]) for k in breed_keys if k in rec and rec[k]), None)
            bd = try_parse_date(bd_str) if bd_str else None
            if bd:
                due_str = (bd + pd.Timedelta(days=150)).strftime("%Y-%m-%d")

        due_date = try_parse_date(due_str) if due_str else None

        # Extract male/female
        male_id = next((str(rec[k]) for k in ["male_id", "Male ID", "sire"] if k in rec and rec[k]), None)
        female_id = next((str(rec[k]) for k in ["female_id", "Female ID", "doe"] if k in rec and rec[k]), None)

        out.append({
            "record_key": rec_id,
            "male_id": male_id,
            "female_id": female_id,
            "due_date": due_date
        })
    return out

# -------------------- Fetch Data --------------------
goats_ref = db.child("users").child(uid).child("records").child("goats")
user_goats = goats_ref.get(token=id_token) or {}

breeding_ref = db.child("users").child(uid).child("records").child("breeding")
breeding_data_raw = breeding_ref.get(token=id_token)
breeding_records = normalize_breeding_records(breeding_data_raw)

# -------------------- Stats --------------------
total_goats = len(user_goats)
male_count = sum(1 for g in user_goats.values() if str(g.get("Gender") or g.get("gender") or "").lower().startswith("m"))
female_count = total_goats - male_count

total_pregnancies = len(breeding_records)
today = date.today()

due_soon = overdue = 0
upcoming_list = []

for rec in breeding_records:
    due = rec["due_date"]
    if not due:
        continue
    days_left = (due - today).days
    status = "overdue" if days_left < 0 else ("due_soon" if days_left <= 7 else "future")
    if days_left < 0:
        overdue += 1
    elif days_left <= 7:
        due_soon += 1
    if days_left <= 30:
        upcoming_list.append({
            "Female ID": rec["female_id"] or "—",
            "Male ID": rec["male_id"] or "—",
            "Due Date": due.strftime("%Y-%m-%d"),
            "Days Left": days_left,
            "Status": {"overdue": "Overdue", "due_soon": "Due Soon", "future": "Scheduled"}[status]
        })

upcoming_list.sort(key=lambda x: x["Days Left"])

# -------------------- Farm History --------------------
farm_name_ref = db.child("users").child(uid).child("farm_name").get(token=id_token)
created_ref = db.child("users").child(uid).child("created_at").get(token=id_token)

# Estimate from first goat if no created_at
if not created_ref and user_goats:
    dates = [try_parse_date(str(g.get("Date Added") or g.get("purchase_date") or "")) for g in user_goats.values()]
    dates = [d for d in dates if d]
    created_ref = min(dates).isoformat() if dates else None

farm_age_days = 0
if created_ref:
    try:
        start = datetime.fromisoformat(created_ref.split("T")[0]).date()
        farm_age_days = (today - start).days
    except:
        pass

# -------------------- Display --------------------
st.title(f"Farm Dashboard")
st.markdown(f"**{farm_name_ref or 'My Farm'}** • Active for **{farm_age_days} days**")

col1, col2, col3 = st.columns(3)
col1.metric("Total Goats", f"{total_goats} goat")
col2.metric("Males", f"{male_count} male")
col3.metric("Females", f"{female_count} female")

st.markdown("---")

col_a, col_b, col_c = st.columns(3)
col_a.metric("Total Pregnancies", total_pregnancies)
col_b.metric("Due Soon (≤7 days)", due_soon)
col_c.metric("Overdue", overdue)

# Upcoming Births
st.markdown("## Upcoming Births (Next 30 Days)")
if upcoming_list:
    df = pd.DataFrame(upcoming_list)
    st.dataframe(df, use_container_width=True)
else:
    st.info("No births expected in the next 30 days.")

# AI Insights
st.markdown("### Quick AI Insights")
if overdue:
    st.warning(f"{overdue} overdue birth(s) — act now!")
elif due_soon:
    st.info(f"{due_soon} due within 7 days — prepare!")
else:
    st.success("All clear — farm is stable.")

# Pie Chart
if upcoming_list:
    status_df = df["Status"].value_counts().reset_index()
    status_df.columns = ["Status", "Count"]
    fig = px.pie(status_df, names="Status", values="Count", color_discrete_sequence=px.colors.sequential.Reds)
    st.plotly_chart(fig, use_container_width=True)

# -------------------- Live Goat Farming News --------------------
st.markdown("---")
st.subheader("Goat Farming News & Trends")

feed_urls = [
    "https://news.google.com/rss/search?q=goat+farming+trends&hl=en-US&gl=US&ceid=US:en",
    "https://www.thecattlesite.com/rss/goats/",
]

articles = []
for url in feed_urls:
    try:
        feed = feedparser.parse(url)
        for entry in feed.entries[:3]:
            articles.append({
                "title": entry.title,
                "link": entry.link,
                "summary": (entry.get("summary") or "")[:180] + "..."
            })
    except:
        continue

if articles:
    for art in articles:
        st.markdown(f"**[{art['title']}]({art['link']})**")
        st.caption(art["summary"])
        st.markdown("---")
else:
    st.info("News feed unavailable. Try again later.")