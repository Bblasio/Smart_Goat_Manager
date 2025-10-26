# pages/Dashboard.py
import streamlit as st
from datetime import datetime

# =============================================
# 1. AUTH GUARD
# =============================================
if "authenticated" not in st.session_state or not st.session_state.authenticated:
    st.warning("Please log in to access your dashboard.")
    st.stop()

# =============================================
# 2. GET USER & TOKEN
# =============================================
user = st.session_state.user
uid = user["localId"]
id_token = user["idToken"]

# =============================================
# 3. IMPORT DB FROM app.py
# =============================================
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app import db

# =============================================
# 4. HELPER: Safe .val()
# =============================================
def get_val(resp):
    return resp.val() if resp and resp.val() is not None else {}

# =============================================
# 5. FETCH FARM DATA (Safe)
# =============================================
farm_resp = db.child("users").child(uid).get(token=id_token)
farm_data = get_val(farm_resp)
farm_name = farm_data.get("farm_name", "My Farm")
created_at = farm_data.get("created_at")

st.set_page_config(page_title=f"{farm_name} – Dashboard", page_icon="chart", layout="wide")
st.title(f"{farm_name} – Dashboard")

# =============================================
# 6. GOATS: Total, Male, Female
# =============================================
goats_resp = db.child("users").child(uid).child("records").child("goats").get(token=id_token)
goats = get_val(goats_resp)
total_goats = len(goats)

males = sum(
    1 for g in goats.values()
    if str(g.get("gender") or "").lower().startswith("m")
)
females = total_goats - males

# =============================================
# 7. PREGNANT GOATS
# =============================================
breeding_resp = db.child("users").child(uid).child("records").child("breeding").get(token=id_token)
breeding = get_val(breeding_resp)
pregnant_count = len(breeding)

# =============================================
# 8. WORKERS (from user_profile)
# =============================================
workers_resp = db.child("users").child(uid).child("records").child("user_profile").get(token=id_token)
workers = get_val(workers_resp)
total_workers = len(workers)

# =============================================
# 9. METRICS: 4 Columns
# =============================================
c1, c2, c3, c4 = st.columns(4)
with c1:
    st.metric("Total Goats", total_goats)
with c2:
    st.metric("Male Goats", males)
with c3:
    st.metric("Female Goats", females)
with c4:
    st.metric("Pregnant Goats", pregnant_count)

# =============================================
# 10. WORKERS ROW
# =============================================
st.markdown("---")
w1, w2 = st.columns([1, 3])
with w1:
    st.metric("Total Workers", total_workers)
with w2:
    st.write("")  # empty space

# =============================================
# 11. FARM AGE (Safe)
# =============================================
if created_at:
    try:
        created_date = datetime.fromisoformat(created_at.split("T")[0])
        days_active = (datetime.now() - created_date).days
        st.caption(f"Farm active for {days_active} days")
    except:
        st.caption("Farm age: Unknown")
else:
    st.caption("Farm age: Just created")