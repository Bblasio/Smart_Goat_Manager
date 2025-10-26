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
# 3. IMPORT DB
# =============================================
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app import db

# =============================================
# 4. HELPER: Safe .val()
# =============================================
def get_val(resp):
    return resp.val() if resp and resp.val() is not None else {}

# =============================================
# 5. FETCH FARM DATA
# =============================================
farm_resp = db.child("users").child(uid).get(token=id_token)
farm_data = get_val(farm_resp)
farm_name = farm_data.get("farm_name", "My Farm")
created_at = farm_data.get("created_at")

# =============================================
# 6. PAGE CONFIG (MOBILE-OPTIMIZED)
# =============================================
st.set_page_config(
    page_title=f"{farm_name} – Dashboard",
    page_icon="goat",
    layout="centered",  # Better for mobile
    initial_sidebar_state="auto"
)
st.title(f"{farm_name}")

# =============================================
# 7. FETCH RECORDS
# =============================================
goats = get_val(db.child("users").child(uid).child("records").child("goats").get(token=id_token))
breeding = get_val(db.child("users").child(uid).child("records").child("breeding").get(token=id_token))
workers = get_val(db.child("users").child(uid).child("records").child("user_profile").get(token=id_token))

# =============================================
# 8. CALCULATE METRICS
# =============================================
total_goats = len(goats)
males = sum(1 for g in goats.values() if str(g.get("gender") or "").lower().startswith("m"))
females = total_goats - males
pregnant_count = len(breeding)
total_workers = len(workers)

# =============================================
# 9. RESPONSIVE METRICS (Stack on Mobile)
# =============================================
st.markdown("### Farm Overview")

# Use CSS to stack on small screens
st.markdown(
    """
    <style>
    @media (max-width: 640px) {
        .stMetric { margin-bottom: 1rem; }
    }
    </style>
    """,
    unsafe_allow_html=True
)

# 4 Metrics in 2x2 grid on large, stacked on mobile
col1, col2 = st.columns(2)
with col1:
    st.metric("Total Goats", total_goats)
    st.metric("Male Goats", males)
with col2:
    st.metric("Female Goats", females)
    st.metric("Pregnant Goats", pregnant_count)

# Workers below
st.markdown("---")
st.metric("Total Workers", total_workers)

# =============================================
# 10. FARM AGE
# =============================================
if created_at:
    try:
        created_date = datetime.fromisoformat(created_at.split("T")[0])
        days_active = (datetime.now() - created_date).days
        st.caption(f"Farm active for **{days_active} days**")
    except:
        st.caption("Farm age: Unknown")
else:
    st.caption("Farm age: Just created")

# =============================================
# 11. OPTIONAL: Quick Stats Table (Mobile-Friendly)
# =============================================
with st.expander("View All Stats"):
    stats = {
        "Metric": ["Total Goats", "Males", "Females", "Pregnant", "Workers"],
        "Count": [total_goats, males, females, pregnant_count, total_workers]
    }
    st.table(stats)