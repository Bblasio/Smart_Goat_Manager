# pages/Reports.py
import streamlit as st
from datetime import datetime, timedelta
import uuid

# --- Auth Guard ---
if "authenticated" not in st.session_state or not st.session_state.authenticated:
    st.warning("Please log in.")
    st.stop()

user = st.session_state.user
uid = user["localId"]
id_token = user["idToken"]

# --- Import db ---
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app import db

# --- Helper: Safe .val() ---
def get_val(resp):
    return resp.val() if resp and resp.val() else {}

# --- Fetch All Data ---
farm_name = db.child("users").child(uid).child("farm_name").get(token=id_token).val() or "My Farm"
st.set_page_config(page_title="Reports", page_icon="document", layout="wide")
st.title(f"{farm_name} – AI Reports")

goats = get_val(db.child("users").child(uid).child("records").child("goats").get(token=id_token))
breeding = get_val(db.child("users").child(uid).child("records").child("breeding").get(token=id_token))
sales = get_val(db.child("users").child(uid).child("records").child("sales").get(token=id_token))
health = get_val(db.child("users").child(uid).child("records").child("health").get(token=id_token))

# --- 1. Highest Sales ---
def highest_sales():
    st.subheader("Highest Sales")
    if sales:
        sales_list = []
        for sid, s in sales.items():
            try:
                price = float(s.get("price", 0))
                sales_list.append({
                    "Goat ID": s.get("goat_id", "—"),
                    "Buyer": s.get("buyer_name", "—"),
                    "Price (Ksh)": price,
                    "Date": s.get("sale_date", "—")
                })
            except:
                continue
        if sales_list:
            df = pd.DataFrame(sales_list).sort_values("Price (Ksh)", ascending=False)
            top = df.head(5)
            st.dataframe(top, use_container_width=True)
            st.success(f"Top sale: **Ksh {top.iloc[0]['Price (Ksh)']:,}** for Goat {top.iloc[0]['Goat ID']}")
        else:
            st.info("No valid sales data.")
    else:
        st.info("No sales recorded yet.")

# --- 2. Predicted Birth Dates (AI: 150-day gestation) ---
def predicted_births():
    st.subheader("Predicted Birth Dates (AI)")
    if breeding:
        preds = []
        for bid, b in breeding.items():
            mating_str = b.get("mating_date")
            if not mating_str:
                continue
            try:
                mating_date = datetime.fromisoformat(mating_str.split("T")[0])
                predicted = mating_date + timedelta(days=150)
                days_left = (predicted - datetime.now()).days
                status = "Due Soon" if days_left <= 7 else ("Upcoming" if days_left <= 30 else "Future")
                preds.append({
                    "Female": b.get("female_id", "—"),
                    "Mating": mating_date.strftime("%b %d"),
                    "Predicted Birth": predicted.strftime("%b %d, %Y"),
                    "Days Left": max(0, days_left),
                    "Status": status
                })
            except:
                continue
        if preds:
            df = pd.DataFrame(preds).sort_values("Days Left")
            st.dataframe(df, use_container_width=True)
            due_soon = df[df["Days Left"] <= 7]
            if not due_soon.empty:
                st.warning(f"{len(due_soon)} birth(s) due in 7 days!")
        else:
            st.info("No valid breeding dates.")
    else:
        st.info("No breeding records.")

# --- 3. AI Recommendations ---
def ai_recommendations():
    st.subheader("AI Recommendations")
    recs = []

    # Breeding
    if breeding:
        active_females = len({b.get("female_id") for b in breeding.values() if b.get("female_id")})
        total_females = sum(1 for g in goats.values() if str(g.get("gender")).lower() == "female") if goats else 0
        if total_females > active_females:
            recs.append("Consider breeding more females to increase herd size.")

    # Health
    if health:
        recent = sum(1 for h in health.values() if h.get("checkup_date"))
        if recent == 0:
            recs.append("Schedule health check-ups for all goats.")
        else:
            recs.append("Health monitoring is active.")

    # Sales
    if sales:
        total_revenue = sum(float(s.get("price", 0)) for s in sales.values() if s.get("price"))
        recs.append(f"Total revenue: **Ksh {total_revenue:,.0f}** — great job!")
    else:
        recs.append("Start recording sales to track income.")

    # General
    total_goats = len(goats) if goats else 0
    if total_goats < 5:
        recs.append("Farm is small — consider expansion.")
    elif total_goats > 50:
        recs.append("Large herd — ensure proper feeding and space.")

    if recs:
        for r in recs:
            st.write(f"• {r}")
    else:
        st.success("All systems optimal!")

# --- 4. Bonus: Farm Summary ---
def farm_summary():
    st.subheader("Farm Summary")
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.metric("Total Goats", len(goats) if goats else 0)
    with col2:
        st.metric("Active Breeding", len(breeding) if breeding else 0)
    with col3:
        st.metric("Total Sales", len(sales) if sales else 0)
    with col4:
        st.metric("Health Checks", len(health) if health else 0)

# --- Layout ---
with st.expander("Highest Sales", expanded=True):
    highest_sales()

with st.expander("Predicted Birth Dates (AI)", expanded=True):
    predicted_births()

with st.expander("AI Recommendations", expanded=True):
    ai_recommendations()

with st.expander("Farm Summary", expanded=False):
    farm_summary()

# --- Export (Future) ---
with st.expander("Export Reports", expanded=False):
    st.write("Export to PDF/CSV coming soon.")
    st.button("Generate PDF")