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

# --- Fetch Data (use .val()!) ---
farm_name = db.child("users").child(uid).child("farm_name").get(token=id_token).val() or "My Farm"
st.title(f"{farm_name} – Dashboard")

# Total Goats
goats_resp = db.child("users").child(uid).child("records").child("goats").get(token=id_token)
goats = goats_resp.val() if goats_resp else {}
total_goats = len(goats) if goats else 0

# Pregnant Goats
breeding_resp = db.child("users").child(uid).child("records").child("breeding").get(token=id_token)
breeding = breeding_resp.val() if breeding_resp else {}
pregnant_count = len(breeding) if breeding else 0

# Total Users (all farms)
all_users_resp = db.child("users").get(token=id_token)
all_users = all_users_resp.val() if all_users_resp else {}
total_users = len(all_users) if all_users else 0

# --- Metrics ---
c1, c2, c3 = st.columns(3)
c1.metric("Total Goats", total_goats)
c2.metric("Pregnant Goats", pregnant_count)
c3.metric("Total Users", total_users)

# --- Farm age ---
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