# pages/Manage Records.py
import streamlit as st
import uuid
from datetime import datetime, timedelta
import pandas as pd
import sys, os

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
        st.session_state["deleted"] = True
        st.rerun()
    except Exception as e:
        st.error(f"Delete failed: {e}")

def get_records(collection: str) -> dict:
    resp = db.child("users").child(uid).child("records").child(collection).get(token=id_token)
    return resp.val() if resp and resp.val() else {}

# =============================================
# 4. HANDLE QUERY PARAMS UPDATE
# =============================================
try:
    st.query_params  # Modern Streamlit (>=1.32)
except AttributeError:
    st.query_params = st.experimental_get_query_params()  # Backward compatibility

# =============================================
# 5. PAGE SETUP
# =============================================
st.set_page_config(page_title="Farm Records", layout="wide")
st.title("🐐 Farm Records & AI Insights")

tabs = st.tabs(["Goats", "Breeding", "Health", "Sales", "Workers", "AI Advisor"])

# =============================================
# 6. FETCH DATA
# =============================================
goats = get_records("goats")
breeding = get_records("breeding")
health = get_records("health")
sales = get_records("sales")
workers = get_records("user_profile")

# =============================================
# 7. DISPLAY FUNCTION (DELETE BUTTON PER ROW)
# =============================================
def show_table(collection: str, records: dict, columns: list):
    """Show only relevant columns and add a per-row delete button."""
    if not records:
        st.info(f"No {collection} records found.")
        return

    for rid, rec in records.items():
        cols = st.columns([2] * len(columns) + [1])
        for i, col_name in enumerate(columns):
            with cols[i]:
                label = col_name.replace("_", " ")
                st.text(f"{label}: {rec.get(col_name.lower(), '—')}")
        with cols[-1]:
            if st.button("🗑️ Delete", key=f"del_{collection}_{rid}"):
                delete_record(collection, rid)
        st.divider()  # separator between entries

# =============================================
# 8. GOATS
# =============================================
with tabs[0]:
    st.subheader("🐐 Goats")
    show_table("goats", goats, ["Tag_Number", "Breed", "Gender", "Dob"])

# =============================================
# 9. BREEDING
# =============================================
with tabs[1]:
    st.subheader("🧬 Breeding & Births")
    show_table("breeding", breeding, ["Female_Id", "Male_Id", "Mating_Date", "Expected_Birth"])

# =============================================
# 10. HEALTH
# =============================================
with tabs[2]:
    st.subheader("💊 Health Records")
    show_table("health", health, ["Goat_Id", "Condition", "Treatment", "Checkup_Date"])

# =============================================
# 11. SALES
# =============================================
with tabs[3]:
    st.subheader("💰 Sales")
    show_table("sales", sales, ["Goat_Id", "Buyer_Name", "Price", "Sale_Date"])

# =============================================
# 12. WORKERS
# =============================================
with tabs[4]:
    st.subheader("👷 Workers")
    show_table("user_profile", workers, ["Full_Name", "Phone", "Location"])

# =============================================
# 13. AI RECOMMENDATIONS
# =============================================
with tabs[5]:
    st.subheader("🤖 AI Farm Advisor")
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
            recs.append(f"{due_soon} goat(s) due within 7 days — prepare for delivery! 🍼")
        else:
            recs.append("No goats due soon.")

    sick = len([h for h in health.values() if h.get("condition", "").lower() in ["sick", "weak"]])
    if sick:
        recs.append(f"{sick} goat(s) need urgent care 🩺.")
    else:
        recs.append("All goats healthy ✅.")

    total_sales = sum(float(s.get("price", 0)) for s in sales.values())
    recs.append(f"Total sales: **Ksh {total_sales:,.0f}**")
    recs.append(f"Total goats: **{len(goats)}**")

    for r in recs:
        st.write(f"• {r}")

# =============================================
# 14. SIDEBAR: ADD RECORDS
# =============================================
with st.sidebar:
    st.subheader("➕ Add New Record")
    rec_type = st.selectbox("Select Type", ["", "Goat", "Breeding", "Health", "Sales", "Worker"])

    # GOAT FORM
    if rec_type == "Goat":
        with st.form("add_goat", clear_on_submit=True):
            tag = st.text_input("Tag Number *")
            breed = st.text_input("Breed *")
            gender = st.selectbox("Gender", ["Male", "Female"])
            dob = st.date_input("Date of Birth")
            submitted = st.form_submit_button("Save Goat")
            if submitted:
                if tag and breed:
                    add_record("goats", {
                        "tag_number": tag,
                        "breed": breed,
                        "gender": gender,
                        "dob": str(dob),
                        "created_at": datetime.now().isoformat()
                    })
                else:
                    st.error("Please fill all required fields.")

    # BREEDING FORM
    elif rec_type == "Breeding":
        with st.form("add_breed", clear_on_submit=True):
            f = st.text_input("Female Tag *")
            m = st.text_input("Male Tag *")
            mate = st.date_input("Mating Date")
            exp = st.date_input("Expected Birth", value=mate + timedelta(days=150))
            submitted = st.form_submit_button("Save Breeding")
            if submitted:
                if f and m:
                    add_record("breeding", {
                        "female_id": f,
                        "male_id": m,
                        "mating_date": str(mate),
                        "expected_birth": str(exp)
                    })
                else:
                    st.error("Female and Male tags are required.")

    # HEALTH FORM
    elif rec_type == "Health":
        with st.form("add_health", clear_on_submit=True):
            g = st.text_input("Goat Tag *")
            c = st.text_input("Condition")
            t = st.text_input("Treatment")
            d = st.date_input("Check-up Date")
            submitted = st.form_submit_button("Save Health Record")
            if submitted:
                if g:
                    add_record("health", {
                        "goat_id": g,
                        "condition": c,
                        "treatment": t,
                        "checkup_date": str(d)
                    })
                else:
                    st.error("Goat tag is required.")

    # SALES FORM
    elif rec_type == "Sales":
        with st.form("add_sale", clear_on_submit=True):
            g = st.text_input("Goat Tag *")
            b = st.text_input("Buyer Name")
            p = st.number_input("Price", min_value=0.0)
            d = st.date_input("Sale Date")
            submitted = st.form_submit_button("Save Sale")
            if submitted:
                if g:
                    add_record("sales", {
                        "goat_id": g,
                        "buyer_name": b,
                        "price": p,
                        "sale_date": str(d)
                    })
                else:
                    st.error("Goat tag is required.")

    # WORKER FORM
    elif rec_type == "Worker":
        with st.form("add_worker", clear_on_submit=True):
            n = st.text_input("Full Name *")
            p = st.text_input("Phone")
            l = st.text_input("Location")
            submitted = st.form_submit_button("Save Worker")
            if submitted:
                if n:
                    add_record("user_profile", {
                        "full_name": n,
                        "phone": p,
                        "location": l
                    })
                else:
                    st.error("Full name is required.")
