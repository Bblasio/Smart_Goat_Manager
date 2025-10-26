# pages/Dashboard.py
import streamlit as st
from datetime import datetime
import plotly.express as px
import pandas as pd

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
# 3. IMPORT DB (unchanged)
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
# 6. PAGE CONFIG (MOBILE FRIENDLY)
# =============================================
st.set_page_config(
    page_title=f"{farm_name} – Dashboard",
    page_icon="🐐",
    layout="centered",
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
# 9. FARM OVERVIEW METRICS
# =============================================
st.markdown("### 🧮 Farm Overview")

# Display metrics in a responsive layout
col1, col2 = st.columns(2)
with col1:
    st.metric("Total Goats", total_goats)
    st.metric("Male Goats", males)
with col2:
    st.metric("Female Goats", females)
    st.metric("Pregnant Goats", pregnant_count)

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
# 11. VISUALIZATIONS
# =============================================
st.markdown("### 📊 Farm Insights")

# --- Gender Distribution Chart ---
if total_goats > 0:
    gender_data = pd.DataFrame({
        "Gender": ["Male", "Female"],
        "Count": [males, females]
    })
    fig_gender = px.pie(
        gender_data,
        names="Gender",
        values="Count",
        title="Gender Distribution Among Goats",
        color_discrete_sequence=px.colors.qualitative.Pastel
    )
    st.plotly_chart(fig_gender, use_container_width=True)
else:
    st.info("No goats recorded yet to display gender distribution.")

# --- Breeding Activity Trend ---
if breeding:
    df_breed = pd.DataFrame(list(breeding.values()))
    if "mating_date" in df_breed.columns:
        df_breed["Month"] = pd.to_datetime(df_breed["mating_date"], errors="coerce").dt.strftime("%b")
        trend = df_breed["Month"].value_counts().sort_index()
        st.markdown("### 🐐 Breeding Activity Over Time")
        st.bar_chart(trend)
    else:
        st.info("Breeding records exist but no valid date field found.")
else:
    st.info("No breeding records available yet.")
