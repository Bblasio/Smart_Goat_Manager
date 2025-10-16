# pages/Dashboard.py

import streamlit as st
import pandas as pd
import plotly.express as px
from datetime import datetime, date
import firebase_admin
from firebase_admin import credentials, db
import feedparser  # 👈 for pulling live news feeds

# -------------------- Firebase initialization --------------------
if not firebase_admin._apps:
    cred = credentials.Certificate(
        r"C:\Users\User\Desktop\Projects\smart-goat-farm\serviceAccountKey.json"
    )
    firebase_admin.initialize_app(cred, {
         "databaseURL": "ENV_VARIABLE"
    })

# -------------------- Page config --------------------
st.set_page_config(page_title="Dashboard", page_icon="📊", layout="wide")

# -------------------- Authentication guard --------------------
if "authenticated" not in st.session_state or not st.session_state.authenticated:
    st.warning("Please log in to view your dashboard.")
    st.stop()

st.title("📊 Farm Dashboard")
st.write("Welcome to your Smart Goat Farm overview page.")

# -------------------- Helper functions --------------------
def try_parse_date(s):
    if not s or not isinstance(s, str):
        return None
    for fmt in ("%Y-%m-%d", "%Y/%m/%d", "%d-%m-%Y", "%d/%m/%Y"):
        try:
            return datetime.strptime(s, fmt).date()
        except Exception:
            continue
    try:
        return datetime.fromisoformat(s).date()
    except Exception:
        return None

def normalize_breeding_records(raw):
    out = []
    if not raw:
        return out

    if isinstance(raw, dict):
        items = list(raw.items())
    elif isinstance(raw, list):
        items = [(i, rec) for i, rec in enumerate(raw)]
    else:
        return out

    for rec_id, rec in items:
        if not rec or not isinstance(rec, dict):
            continue

        possible_date_keys = [
            "expected_due_date", "Expected Due Date", "expectedBirthDate",
            "expected_birth_date", "ExpectedBirthDate", "expected date",
            "due_date", "dueDate", "Expected Due", "ExpectedDueDate"
        ]
        due_str = None
        for k in possible_date_keys:
            if k in rec and rec[k]:
                due_str = str(rec[k])
                break

        if not due_str:
            breed_keys = ["breeding_date", "Breeding Date", "mating_date", "matingDate"]
            for k in breed_keys:
                if k in rec and rec[k]:
                    bd = try_parse_date(str(rec[k]))
                    if bd:
                        due_str = (bd + pd.Timedelta(days=150)).strftime("%Y-%m-%d")
                    break

        due_date = try_parse_date(due_str) if due_str else None

        male_id = None
        female_id = None
        for k in ("male_id", "Male ID", "male", "sire", "father"):
            if k in rec and rec[k]:
                male_id = str(rec[k])
                break
        for k in ("female_id", "Female ID", "female", "doe", "mother"):
            if k in rec and rec[k]:
                female_id = str(rec[k])
                break

        out.append({
            "record_key": rec_id,
            "male_id": male_id,
            "female_id": female_id,
            "raw_due_str": due_str,
            "due_date": due_date
        })
    return out

# -------------------- Fetch user data --------------------
user_id = st.session_state.user['localId']

# 🐐 Goat counts
goats_ref = db.reference(f"users/{user_id}/records/goats")
user_goats = goats_ref.get()

total_goats = 0
male_count = 0
female_count = 0

if isinstance(user_goats, dict):
    total_goats = len(user_goats)
    for g in user_goats.values():
        gender = (g.get("Gender") or g.get("gender") or g.get("sex") or "").lower()
        if gender.startswith("m"):
            male_count += 1
        elif gender.startswith("f"):
            female_count += 1

# 🧬 Breeding records
breeding_ref = db.reference(f"users/{user_id}/records/breeding")
breeding_data_raw = breeding_ref.get()
breeding_records = normalize_breeding_records(breeding_data_raw)

# -------------------- Compute stats --------------------
today = date.today()
total_pregnancies = len(breeding_records)
due_soon = 0
overdue = 0
upcoming_list = []

for rec in breeding_records:
    due = rec["due_date"]
    if not due:
        continue

    days_left = (due - today).days
    if days_left < 0:
        status = "overdue"
        overdue += 1
    elif days_left <= 7:
        status = "due_soon"
        due_soon += 1
    else:
        status = "future"

    if days_left <= 30:
        upcoming_list.append({
            "Female ID": rec["female_id"] or "Unknown",
            "Male ID": rec["male_id"] or "Unknown",
            "Due Date": due.strftime("%Y-%m-%d"),
            "Days Left": days_left,
            "Status": status
        })

upcoming_list.sort(key=lambda x: datetime.strptime(x["Due Date"], "%Y-%m-%d").date())

# -------------------- Display Metrics --------------------
col1, col2, col3 = st.columns(3)
col1.metric(label="Total Goats", value=f"{total_goats} 🐐")
col2.metric(label="Males", value=f"{male_count} ♂️")
col3.metric(label="Females", value=f"{female_count} ♀️")

st.markdown("---")

col_a, col_b, col_c = st.columns(3)
col_a.metric(label="🍼 Total Pregnancies", value=total_pregnancies)
col_b.metric(label="🚨 Due Soon (≤7 days)", value=due_soon)
col_c.metric(label="⚠️ Overdue Births", value=overdue)

# -------------------- Upcoming Births Table --------------------
st.markdown("## 🧬 Upcoming Births (Next 30 Days)")

if upcoming_list:
    df_up = pd.DataFrame(upcoming_list)
    df_up["Status"] = df_up["Status"].map({
        "due_soon": "Due Soon",
        "overdue": "Overdue",
        "future": "Scheduled"
    })
    st.dataframe(df_up, use_container_width=True)
else:
    st.info("No births expected in the next 30 days.")

# -------------------- AI Insights --------------------
st.markdown("### 🤖 Quick AI Insights")
if overdue > 0:
    st.warning(f"{overdue} overdue birth(s). Check those animals immediately.")
elif due_soon > 0:
    st.info(f"{due_soon} birth(s) due within 7 days. Prepare birthing area.")
else:
    st.success("No immediate birthing alerts — farm looks stable.")

# -------------------- Pie Chart --------------------
if upcoming_list:
    status_counts = df_up["Status"].value_counts().reset_index()
    status_counts.columns = ["Status", "Count"]
    fig = px.pie(status_counts, names="Status", values="Count", title="Upcoming Births (≤30 Days)")
    st.plotly_chart(fig, use_container_width=True)

# -------------------- 📰 Live News Feed Section --------------------
st.markdown("---")
st.subheader("📰 Goat Farming News & Trends")

# Public RSS feed sources (you can add more)
feed_urls = [
    "https://news.google.com/rss/search?q=goat+farming&hl=en-US&gl=US&ceid=US:en",
    "https://www.thecattlesite.com/rss/goats/",
]

articles = []
for url in feed_urls:
    feed = feedparser.parse(url)
    for entry in feed.entries[:5]:  # limit per source
        articles.append({
            "title": entry.title,
            "link": entry.link,
            "summary": entry.get("summary", "")[:200] + "..."
        })

if articles:
    for art in articles:
        with st.container():
            st.markdown(f"### [{art['title']}]({art['link']})")
            st.write(art["summary"])
            st.markdown("---")
else:
    st.info("No news found at the moment. Try again later.")
