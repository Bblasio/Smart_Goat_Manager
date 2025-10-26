# pages/Manage Records.py
import streamlit as st
import uuid
from datetime import datetime, timedelta
import pandas as pd

# =============================================
# 1. AUTH GUARD
# =============================================
if "authenticated" not in st.session_state or not st.session_state.authenticated:
    st.warning("Please log in first.")
    st.stop()

user = st.session_state.user
uid = user["localId"]
id_token = user["idToken"]

# =============================================
# 2. IMPORT DB
# =============================================
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app import db

# =============================================
# 3. HELPERS
# =============================================
def gen_id():
    return str(uuid.uuid4())

def add_record(collection: str, data: dict):
    rid = gen_id()
    db.child("users").child(uid).child("records").child(collection).child(rid).set(data, token=id_token)
    st.success(f"{collection.title()} added!")

def delete_record(collection: str, rid: str):
    """Delete one record from Firebase"""
    try:
        db.child("users").child(uid).child("records").child(collection).child(rid).remove(token=id_token)
        st.success("Deleted successfully!")
        st.rerun()
    except Exception as e:
        st.error(f"Delete failed: {e}")

def get_records(collection: str) -> dict:
    resp = db.child("users").child(uid).child("records").child(collection).get(token=id_token)
    return resp.val() if resp and resp.val() else {}

# =============================================
# 4. PAGE SETUP
# =============================================
st.set_page_config(page_title="Farm Records", layout="wide")
st.title("Farm Records & AI Insights")

tabs = st.tabs(["Goats", "Breeding", "Health", "Sales", "Workers", "AI Advisor"])

# =============================================
# 5. FETCH DATA
# =============================================
goats = get_records("goats")
breeding = get_records("breeding")
health = get_records("health")
sales = get_records("sales")
workers = get_records("user_profile")

# =============================================
# 6. CUSTOM TABLE DISPLAY (NO ID COLUMN)
# =============================================
def show_table(collection: str, records: dict, columns: list, label_map: dict = None):
    """
    Render clean table: only desired fields and one Delete button per row.
    """
    if not records:
        st.info(f"No {collection} records found.")
        return

    label_map = label_map or {}
    table_rows = []
    for rid, rec in records.items():
        row = {}
        for col in columns:
            key = col.lower()
            row[label_map.get(col, col)] = rec.get(key, "—")
        row["Action"] = f'<button style="background-color:#ff4b4b;color:white;border:none;padding:5px 10px;border-radius:5px;" onclick="window.location.href=\'?delete={rid}&col={collection}\'">🗑️ Delete</button>'
        table_rows.append((rid, row))

    # Convert to DataFrame
    df = pd.DataFrame([r for _, r in table_rows])
    st.write(df.to_html(escape=False, index=False), unsafe_allow_html=True)

    # Handle delete request via query param (Streamlit limitation for inline HTML)
    query_params = st.experimental_get_query_params()
    if "delete" in query_params and "col" in query_params:
        delete_record(query_params["col"][0], query_params["delete"][0])

# =============================================
# 7. GOATS
# =============================================
with tabs[0]:
    st.subheader("Goats")
    show_table("goats", goats, ["tag_number", "breed", "gender", "dob"], {"tag_number": "Tag", "dob": "Date of Birth"})

# =============================================
# 8. BREEDING
# =============================================
with tabs[1]:
    st.subheader("Breeding & Births")
    if breeding:
        table_rows = []
        for rid, b in breeding.items():
            try:
                exp = datetime.fromisoformat(b.get("expected_birth", "").split("T")[0])
                days_left = (exp.date() - datetime.now().date()).days
            except:
                days_left = "—"
            table_rows.append({
                "Female": b.get("female_id", "—"),
                "Male": b.get("male_id", "—"),
                "Mating Date": b.get("mating_date", "—"),
                "Expected Birth": b.get("expected_birth", "—"),
                "Days Left": days_left,
                "Action": f'<button style="background-color:#ff4b4b;color:white;border:none;padding:5px 10px;border-radius:5px;" onclick="window.location.href=\'?delete={rid}&col=breeding\'">🗑️ Delete</button>'
            })
        df = pd.DataFrame(table_rows)
        st.write(df.to_html(escape=False, index=False), unsafe_allow_html=True)
        query_params = st.experimental_get_query_params()
        if "delete" in query_params and query_params.get("col", [""])[0] == "breeding":
            delete_record("breeding", query_params["delete"][0])
    else:
        st.info("No breeding records found.")

# =============================================
# 9. HEALTH
# =============================================
with tabs[2]:
    st.subheader("Health Records")
    if health:
        table_rows = []
        for rid, h in health.items():
            table_rows.append({
                "Goat": h.get("goat_id", "—"),
                "Condition": h.get("condition", "—"),
                "Treatment": h.get("treatment", "—"),
                "Checkup Date": h.get("checkup_date", "—"),
                "Action": f'<button style="background-color:#ff4b4b;color:white;border:none;padding:5px 10px;border-radius:5px;" onclick="window.location.href=\'?delete={rid}&col=health\'">🗑️ Delete</button>'
            })
        df = pd.DataFrame(table_rows)
        st.write(df.to_html(escape=False, index=False), unsafe_allow_html=True)
        query_params = st.experimental_get_query_params()
        if "delete" in query_params and query_params.get("col", [""])[0] == "health":
            delete_record("health", query_params["delete"][0])
    else:
        st.info("No health records found.")

# =============================================
# 10. SALES
# =============================================
with tabs[3]:
    st.subheader("Sales")
    if sales:
        table_rows = []
        for rid, s in sales.items():
            table_rows.append({
                "Goat": s.get("goat_id", "—"),
                "Buyer": s.get("buyer_name", "—"),
                "Price": f"Ksh {s.get('price', 0):,}",
                "Sale Date": s.get("sale_date", "—"),
                "Action": f'<button style="background-color:#ff4b4b;color:white;border:none;padding:5px 10px;border-radius:5px;" onclick="window.location.href=\'?delete={rid}&col=sales\'">🗑️ Delete</button>'
            })
        df = pd.DataFrame(table_rows)
        st.write(df.to_html(escape=False, index=False), unsafe_allow_html=True)
        query_params = st.experimental_get_query_params()
        if "delete" in query_params and query_params.get("col", [""])[0] == "sales":
            delete_record("sales", query_params["delete"][0])
    else:
        st.info("No sales found.")

# =============================================
# 11. WORKERS
# =============================================
with tabs[4]:
    st.subheader("Workers")
    if workers:
        table_rows = []
        for rid, w in workers.items():
            table_rows.append({
                "Full Name": w.get("full_name", "—"),
                "Phone": w.get("phone", "—"),
                "Location": w.get("location", "—"),
                "Action": f'<button style="background-color:#ff4b4b;color:white;border:none;padding:5px 10px;border-radius:5px;" onclick="window.location.href=\'?delete={rid}&col=user_profile\'">🗑️ Delete</button>'
            })
        df = pd.DataFrame(table_rows)
        st.write(df.to_html(escape=False, index=False), unsafe_allow_html=True)
        query_params = st.experimental_get_query_params()
        if "delete" in query_params and query_params.get("col", [""])[0] == "user_profile":
            delete_record("user_profile", query_params["delete"][0])
    else:
        st.info("No workers found.")

# =============================================
# 12. AI RECOMMENDATIONS
# =============================================
with tabs[5]:
    st.subheader("AI Farm Advisor")
    recs = []

    if breeding:
        today = datetime.now().date()
        due_soon = 0
        for b in breeding.values():
            try:
                exp = datetime.fromisoformat(b.get("expected_birth", "").split("T")[0]).date()
                if (exp - today).days <= 7:
                    due_soon += 1
            except:
                pass
        if due_soon:
            recs.append(f"{due_soon} goat(s) due within 7 days — prepare for delivery!")
        else:
            recs.append("No goats due soon.")

    sick = len([h for h in health.values() if h.get("condition", "").lower() in ["sick", "weak"]])
    if sick:
        recs.append(f"{sick} goat(s) need urgent care.")
    else:
        recs.append("All goats healthy.")

    total_sales = sum(float(s.get("price", 0)) for s in sales.values())
    recs.append(f"Total sales: **Ksh {total_sales:,.0f}**")
    recs.append(f"Total goats: **{len(goats)}**")

    for r in recs:
        st.write(f"• {r}")
