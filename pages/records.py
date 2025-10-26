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
# 6. DISPLAY TABLES (with Delete Button per Row)
# =============================================
def show_table(collection: str, records: dict, columns: list):
    """Render table for a collection with per-row Delete button"""
    if not records:
        st.info(f"No {collection} records found.")
        return

    table_data = []
    for rid, rec in records.items():
        row = {col: rec.get(col.lower(), "—") for col in columns}
        table_data.append((rid, row))

    df = pd.DataFrame([r for _, r in table_data])
    df["Action"] = [st.button("🗑️ Delete", key=f"del_{collection}_{rid}", on_click=delete_record, args=(collection, rid)) for rid, _ in table_data]

    st.dataframe(df, use_container_width=True)

# =============================================
# 7. GOATS
# =============================================
with tabs[0]:
    st.subheader("Goats")
    show_table("goats", goats, ["Tag_Number", "Breed", "Gender", "Dob"])

# =============================================
# 8. BREEDING
# =============================================
with tabs[1]:
    st.subheader("Breeding & Births")
    if breeding:
        table_data = []
        for rid, b in breeding.items():
            try:
                exp = datetime.fromisoformat(b.get("expected_birth", "").split("T")[0])
                days_left = (exp.date() - datetime.now().date()).days
            except:
                days_left = "—"
            table_data.append({
                "Female": b.get("female_id", "—"),
                "Male": b.get("male_id", "—"),
                "Mating_Date": b.get("mating_date", "—"),
                "Expected_Birth": b.get("expected_birth", "—"),
                "Days_Left": days_left
            })
        df = pd.DataFrame(table_data)
        df["Action"] = [st.button("🗑️ Delete", key=f"del_breeding_{rid}", on_click=delete_record, args=("breeding", rid)) for rid in breeding.keys()]
        st.dataframe(df, use_container_width=True)
    else:
        st.info("No breeding records found.")

# =============================================
# 9. HEALTH
# =============================================
with tabs[2]:
    st.subheader("Health Records")
    if health:
        table_data = []
        for rid, h in health.items():
            table_data.append({
                "Goat": h.get("goat_id", "—"),
                "Condition": h.get("condition", "—"),
                "Treatment": h.get("treatment", "—"),
                "Checkup_Date": h.get("checkup_date", "—")
            })
        df = pd.DataFrame(table_data)
        df["Action"] = [st.button("🗑️ Delete", key=f"del_health_{rid}", on_click=delete_record, args=("health", rid)) for rid in health.keys()]
        st.dataframe(df, use_container_width=True)
    else:
        st.info("No health records found.")

# =============================================
# 10. SALES
# =============================================
with tabs[3]:
    st.subheader("Sales")
    if sales:
        table_data = []
        for rid, s in sales.items():
            table_data.append({
                "Goat": s.get("goat_id", "—"),
                "Buyer": s.get("buyer_name", "—"),
                "Price": f"Ksh {s.get('price', 0):,}",
                "Sale_Date": s.get("sale_date", "—")
            })
        df = pd.DataFrame(table_data)
        df["Action"] = [st.button("🗑️ Delete", key=f"del_sales_{rid}", on_click=delete_record, args=("sales", rid)) for rid in sales.keys()]
        st.dataframe(df, use_container_width=True)
    else:
        st.info("No sales found.")

# =============================================
# 11. WORKERS
# =============================================
with tabs[4]:
    st.subheader("Workers")
    if workers:
        table_data = []
        for rid, w in workers.items():
            table_data.append({
                "Full_Name": w.get("full_name", "—"),
                "Phone": w.get("phone", "—"),
                "Location": w.get("location", "—")
            })
        df = pd.DataFrame(table_data)
        df["Action"] = [st.button("🗑️ Delete", key=f"del_worker_{rid}", on_click=delete_record, args=("user_profile", rid)) for rid in workers.keys()]
        st.dataframe(df, use_container_width=True)
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

# =============================================
# 13. SIDEBAR: ADD RECORDS
# =============================================
with st.sidebar:
    st.subheader("Add New Record")
    rec_type = st.selectbox("Type", ["", "Goat", "Breeding", "Health", "Sales", "Worker"])

    if rec_type == "Goat":
        with st.form("add_goat", clear_on_submit=True):
            tag = st.text_input("Tag *")
            breed = st.text_input("Breed *")
            gender = st.selectbox("Gender", ["Male", "Female"])
            dob = st.date_input("DOB")
            if st.form_submit_button("Save"):
                if tag and breed:
                    add_record("goats", {
                        "tag_number": tag, "breed": breed, "gender": gender,
                        "dob": str(dob), "created_at": datetime.now().isoformat()
                    })
                else:
                    st.error("Fill required fields")

    elif rec_type == "Breeding":
        with st.form("add_breed", clear_on_submit=True):
            f = st.text_input("Female Tag *")
            m = st.text_input("Male Tag *")
            mate = st.date_input("Mating Date")
            exp = st.date_input("Expected Birth", value=mate + timedelta(days=150))
            if st.form_submit_button("Save"):
                if f and m:
                    add_record("breeding", {
                        "female_id": f, "male_id": m,
                        "mating_date": str(mate), "expected_birth": str(exp)
                    })
                else:
                    st.error("Tags required")

    elif rec_type == "Health":
        with st.form("add_health", clear_on_submit=True):
            g = st.text_input("Goat Tag *")
            c = st.text_input("Condition")
            t = st.text_input("Treatment")
            d = st.date_input("Check-up Date")
            if st.form_submit_button("Save"):
                if g:
                    add_record("health", {
                        "goat_id": g, "condition": c, "treatment": t, "checkup_date": str(d)
                    })

    elif rec_type == "Sales":
        with st.form("add_sale", clear_on_submit=True):
            g = st.text_input("Goat Tag *")
            b = st.text_input("Buyer")
            p = st.number_input("Price", min_value=0.0)
            d = st.date_input("Sale Date")
            if st.form_submit_button("Save"):
                if g:
                    add_record("sales", {
                        "goat_id": g, "buyer_name": b, "price": p, "sale_date": str(d)
                    })

    elif rec_type == "Worker":
        with st.form("add_worker", clear_on_submit=True):
            n = st.text_input("Name *")
            p = st.text_input("Phone")
            l = st.text_input("Location")
            if st.form_submit_button("Save"):
                if n:
                    add_record("user_profile", {
                        "full_name": n, "phone": p, "location": l
                    })
