# pages/reports.py
import streamlit as st
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import uuid
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

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

def get_val(resp):
    return resp.val() if resp and resp.val() else {}

# --- Fetch Data ---
farm_name = db.child("users").child(uid).child("farm_name").get(token=id_token).val() or "My Farm"
st.set_page_config(page_title="Reports", page_icon="📊", layout="wide")
st.title(f"{farm_name} – AI Reports Dashboard")

goats = get_val(db.child("users").child(uid).child("records").child("goats").get(token=id_token))
breeding = get_val(db.child("users").child(uid).child("records").child("breeding").get(token=id_token))
sales = get_val(db.child("users").child(uid).child("records").child("sales").get(token=id_token))
health = get_val(db.child("users").child(uid).child("records").child("health").get(token=id_token))

# --- 1️⃣ Highest Sales ---
def highest_sales():
    st.subheader("💰 Highest Sales")
    if not sales:
        st.info("No sales recorded yet.")
        return

    sales_list = []
    for sid, s in sales.items():
        try:
            price = float(s.get("price", 0))
            date = s.get("sale_date", "—")
            sales_list.append({
                "Goat ID": s.get("goat_id", "—"),
                "Price": price,
                "Date": date
            })
        except:
            continue

    if not sales_list:
        st.info("No valid sales data.")
        return

    df = pd.DataFrame(sales_list)
    df = df.sort_values("Price", ascending=False)
    top = df.head(5)
    st.dataframe(top, use_container_width=True)
    st.success(f"🏆 Top sale: Ksh {top.iloc[0]['Price']:,.0f} for Goat {top.iloc[0]['Goat ID']}")

# --- 2️⃣ Predictive Birth Dates ---
def predicted_births():
    st.subheader("🤰 Predicted Birth Dates (AI-based)")
    if not breeding:
        st.info("No breeding records yet.")
        return

    preds = []
    for bid, b in breeding.items():
        mating_str = b.get("mating_date")
        if not mating_str:
            continue
        try:
            mating_date = datetime.fromisoformat(mating_str.split("T")[0])
            predicted = mating_date + timedelta(days=150)
            days_left = (predicted - datetime.now()).days
            preds.append({
                "Female": b.get("female_id", "—"),
                "Predicted Birth": predicted.strftime("%b %d, %Y"),
                "Days Left": max(0, days_left)
            })
        except:
            continue

    if preds:
        df = pd.DataFrame(preds).sort_values("Days Left")
        st.dataframe(df, use_container_width=True)
        due_soon = df[df["Days Left"] <= 7]
        if not due_soon.empty:
            st.warning(f"⚠️ {len(due_soon)} birth(s) due within 7 days!")
    else:
        st.info("No valid dates found.")

# --- 3️⃣ ML: Detect Sales or Health Anomalies ---
def detect_anomalies():
    st.subheader("🧠 AI Anomaly Detection")

    if sales:
        df = pd.DataFrame([
            {"Date": s.get("sale_date"), "Price": float(s.get("price", 0))}
            for s in sales.values() if s.get("price")
        ])
        df["Date"] = pd.to_datetime(df["Date"], errors='coerce')
        df = df.dropna()
        if len(df) > 5:
            X = np.array(df["Price"]).reshape(-1, 1)
            model = IsolationForest(contamination=0.2, random_state=42)
            model.fit(X)
            df["Anomaly"] = model.predict(X)
            outliers = df[df["Anomaly"] == -1]
            if not outliers.empty:
                st.error(f"🚨 Detected {len(outliers)} unusual sale(s) — possible pricing errors or outliers.")
                st.dataframe(outliers, use_container_width=True)
            else:
                st.success("✅ No anomalies detected in sales data.")
        else:
            st.info("Not enough sales data for anomaly detection.")

    elif health:
        st.info("Health anomaly analysis coming soon (requires health metrics).")

# --- 4️⃣ ML: Predict Future Revenue (Linear Regression) ---
def predict_revenue():
    st.subheader("📈 AI Revenue Forecast")

    if not sales:
        st.info("No sales data for prediction.")
        return

    df = pd.DataFrame([
        {"Date": s.get("sale_date"), "Price": float(s.get("price", 0))}
        for s in sales.values() if s.get("price")
    ])
    df["Date"] = pd.to_datetime(df["Date"], errors='coerce')
    df = df.dropna()

    if df.empty:
        st.info("No valid sales date data available.")
        return

    # ✅ Fix: Group only numeric data (avoid summing datetimes)
    df = df.groupby(df["Date"].dt.to_period("M"))["Price"].sum().reset_index()
    df["Month"] = df["Date"].astype(str)
    df["t"] = range(len(df))

    if len(df) >= 3:
        X = df[["t"]]
        y = df["Price"]
        model = LinearRegression()
        model.fit(X, y)
        future_t = np.array([[len(df) + i] for i in range(1, 4)])
        pred = model.predict(future_t)
        forecast_df = pd.DataFrame({
            "Month": [f"Next {i}" for i in range(1, 4)],
            "Predicted Revenue (Ksh)": [round(p, 2) for p in pred]
        })
        st.dataframe(forecast_df, use_container_width=True)
        st.success("📊 Forecast generated using linear regression.")
    else:
        st.info("Not enough data for revenue forecasting.")

# --- 5️⃣ AI Insights ---
def ai_recommendations():
    st.subheader("💡 AI Recommendations")

    recs = []
    total_goats = len(goats) if goats else 0
    total_sales = sum(float(s.get("price", 0)) for s in sales.values()) if sales else 0
    sick_goats = [h for h in health.values() if "sick" in str(h).lower()] if health else []

    # --- Intelligent Recommendations ---
    if total_goats > 0 and breeding:
        pregnant = sum(1 for b in breeding.values() if b.get("mating_date"))
        ratio = pregnant / total_goats
        if ratio < 0.2:
            recs.append("🔁 Low breeding ratio — consider synchronizing mating schedules.")
        elif ratio > 0.6:
            recs.append("🐐 High pregnancy rate — prepare for upcoming births.")

    if sick_goats:
        recs.append(f"⚕️ {len(sick_goats)} goat(s) recently reported sick — check isolation and treatment.")
    else:
        recs.append("✅ All goats appear healthy.")

    if total_sales > 0:
        recs.append(f"💰 Revenue so far: Ksh {total_sales:,.0f}. Maintain this momentum!")
    if total_goats < 5:
        recs.append("📉 Low herd size — consider acquiring more goats for better yield.")

    if recs:
        for r in recs:
            st.write(f"• {r}")
    else:
        st.success("🌿 Your farm is performing optimally!")

# --- 6️⃣ Farm Summary ---
def farm_summary():
    st.subheader("📋 Farm Summary")
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.metric("Total Goats", len(goats) if goats else 0)
    with col2:
        st.metric("Breeding Records", len(breeding) if breeding else 0)
    with col3:
        st.metric("Sales", len(sales) if sales else 0)
    with col4:
        st.metric("Health Records", len(health) if health else 0)

# --- Layout ---
with st.expander("💰 Highest Sales", expanded=True):
    highest_sales()

with st.expander("🤰 Predicted Birth Dates", expanded=False):
    predicted_births()

with st.expander("🧠 AI Anomaly Detection", expanded=False):
    detect_anomalies()

with st.expander("📈 Revenue Forecast", expanded=False):
    predict_revenue()

with st.expander("💡 AI Recommendations", expanded=True):
    ai_recommendations()

with st.expander("📋 Farm Summary", expanded=False):
    farm_summary()
