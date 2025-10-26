# pages/Dashboard.py
import streamlit as st
import pandas as pd
from datetime import datetime, date
import feedparser

# -------------------- Page config --------------------
st.set_page_config(page_title="Dashboard", page_icon="chart", layout="wide")

# -------------------- AUTH GUARD: Only logged-in user --------------------
if "authenticated" not in st.session_state or not st.session_state.authenticated:
    st.warning("Please log in to access your dashboard.")
    st.stop()

# -------------------- Get user & token --------------------
user = st.session_state.user
uid = user["localId"]
id_token = user["idToken"]

# Import db from main app (pyrebase)
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app import db

# -------------------- Helper: Parse date --------------------
def try_parse_date(s):
    if not s or not isinstance(s, str): return None
    s = s.split("T")[0]
    for fmt in ("%Y-%m-%d", "%Y/%m/%d", "%d-%m-%Y", "%d/%m/%Y"):
        try: return datetime.strptime(s, fmt).date()
        except: pass
    try: return datetime.fromisoformat(s).date()
    except: return None

# -------------------- Normalize breeding --------------------
def normalize_breeding(raw):
    out = []
    if not raw: return out
    items = raw.items() if isinstance(raw, dict) else enumerate(raw or [])
    for rec_id, rec in items:
        if not rec or not isinstance(rec, dict): continue

        due_str = next((str(rec.get(k)) for k in ["expected_due_date", "due_date", "Expected Due Date"] if rec.get(k)), None)
        if not due_str:
            bd_str = next((str(rec.get(k)) for k in ["breeding_date", "Breeding Date"] if rec.get(k)), None)
            bd = try_parse_date(bd_str) if bd_str else None
            if bd: due_str = (bd + pd.Timedelta(days=150)).strftime("%Y-%m-%d")

        due_date = try_parse_date(due_str) if due_str else None
        male = next((str(rec.get(k)) for k in ["male_id", "sire", "Male ID"] if rec.get(k)), "—")
        female = next((str(rec.get(k)) for k in ["female_id", "doe", "Female ID"] if rec.get(k)), "—")

        out.append({"id": rec_id, "male": male, "female": female, "due": due_date})
    return out

# -------------------- Fetch User Data --------------------
goats = db.child("users").child(uid).child("records").child("goats").get(token=id_token) or {}
breeding_raw = db.child("users").child(uid).child("records").child("breeding").get(token=id_token)
breeding = normalize_breeding(breeding_raw)

# -------------------- Stats --------------------
total_goats = len(goats)
males = sum(1 for g in goats.values() if str(g.get("Gender") or g.get("gender") or "").lower().startswith("m"))
females = total_goats - males
pregnancies = len(breeding)
today = date.today()

due_soon = overdue = 0
upcoming = []

for b in breeding:
    if not b["due"]: continue
    days_left = (b["due"] - today).days
    status = "Overdue" if days_left < 0 else ("Due Soon" if days_left <= 7 else "Future")
    if days_left < 0: overdue += 1
    elif days_left <= 7: due_soon += 1
    if days_left <= 30:
        upcoming.append({
            "Female": b["female"],
            "Male": b["male"],
            "Due": b["due"].strftime("%b %d"),
            "Days Left": days_left,
            "Status": status
        })

upcoming.sort(key=lambda x: x["Days Left"])

# -------------------- Farm History --------------------
farm_name = db.child("users").child(uid).child("farm_name").get(token=id_token) or "My Farm"
created = db.child("users").child(uid).child("created_at").get(token=id_token)
if not created and goats:
    dates = [try_parse_date(str(g.get("Date Added") or g.get("purchase_date") or "")) for g in goats.values()]
    dates = [d for d in dates if d]
    created = min(dates).isoformat() if dates else None

age_days = 0
if created:
    try: age_days = (today - datetime.fromisoformat(created.split("T")[0]).date()).days
    except: pass

# -------------------- DISPLAY --------------------
st.title(f"{farm_name}")
st.caption(f"Farm active for {age_days} days")

c1, c2, c3 = st.columns(3)
c1.metric("Total Goats", total_goats)
c2.metric("Males", males)
c3.metric("Females", females)

st.markdown("---")

cA, cB, cC = st.columns(3)
cA.metric("Pregnancies", pregnancies)
cB.metric("Due Soon", due_soon)
cC.metric("Overdue", overdue)

# Upcoming Births
st.subheader("Upcoming Births (Next 30 Days)")
if upcoming:
    st.dataframe(pd.DataFrame(upcoming), use_container_width=True)
else:
    st.info("No births in next 30 days.")

# AI Alert
if overdue: st.error(f"{overdue} overdue — check now!")
elif due_soon: st.warning(f"{due_soon} due in 7 days — prepare!")
else: st.success("All good — farm stable.")

# -------------------- News --------------------
st.markdown("---")
st.subheader("Goat Farming News")

feeds = [
    "https://news.google.com/rss/search?q=goat+farming&hl=en-US&gl=US&ceid=US:en",
    "https://www.thecattlesite.com/rss/goats/"
]
news = []
for url in feeds:
    try:
        f = feedparser.parse(url)
        for e in f.entries[:2]:
            news.append({"title": e.title, "link": e.link, "sum": (e.get("summary") or "")[:150] + "..."})
    except: pass

if news:
    for n in news:
        st.markdown(f"**[{n['title']}]({n['link']})**")
        st.caption(n["sum"])
else:
    st.info("News unavailable.")