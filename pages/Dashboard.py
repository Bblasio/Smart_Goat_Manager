# pages/Dashboard.py
import streamlit as st
from datetime import datetime

# --- Auth Guard ---
if "authenticated" not in st.session_state or not st.session_state.authenticated:
    st.warning("Please log in.")
    st.stop()

# --- Get user & token ---
user = st.session_state.user
uid = user["localId"]
id_token = user["idToken"]

# --- Import db ---
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app import db

# --- Fetch Data ---
farm_name = db.child("users").child(uid).child("farm_name").get(token=id_token).val() or "My Farm"
st.title(f"{farm_name} – Dashboard")

# === GOATS ===
goats_resp = db.child("users").child(uid).child("records").child("goats").get(token=id_token)
goats = goats_resp.val() if goats_resp else {}
total_goats = len(goats) if goats else 0

# Count Male / Female
males = sum(1 for g in goats.values() if str(g.get("gender", "")).lower() in ["male", "m"])
females = total_goats - males

# === PREGNANT GOATS ===
breeding_resp = db.child("users").child(uid).child("records").child("breeding").get(token=id_token)
breeding = breeding_resp.val() if breeding_resp else {}
pregnant_count = len(breeding) if breeding else 0

# === WORKERS (from user_profile records) ===
workers_resp = db.child("users").child(uid).child("records").child("user_profile").get(token=id_token)
workers = workers_resp.val() if workers_resp else {}
total_workers = len(workers) if workers else 0

# --- Metrics (4 columns) ---
c1, c2, c3, c4 = st.columns(4)

with c1:
    st.metric("Total Goats", total_goats)
with c2:
    st.metric("Male Goats", males)
with c3:
    st.metric("Female Goats", females)
with c4:
    st.metric("Pregnant Goats", pregnant_count)

# --- Workers Row ---
st.markdown("---")
w1, w2 = st.columns(2)
with w1:
    st.metric("Total Workers", total_workers)
with w2:
    st.write("")  # placeholder

# --- Farm Age ---
created_resp = db.child("users").child(uid).child("created_at").get(token=id_token)
created = created_resp.val() if created_resp else None
if created:
    try:
        days = (datetime.now() - datetime.fromisoformat(created.split("T")[0])).days
        st.caption(f"Farm active for {days} days")
    except:
        st.caption("Farm age: Unknown")
else:
    st.caption("Farm age: New")