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

def delete_records(collection: str, selected_ids: list):
    """Delete multiple records from Firebase"""
    try:
        for rid in selected_ids:
            db.child("users").child(uid).child("records").child(collection).child(rid).remove(token=id_token)
        st.success(f"Deleted {len(selected_ids)} record(s) successfully!")
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
# 6. TABLE DISPLAY FUNCTION
# =============================================
def show_table_with_checkbox(collection: str, df: pd.DataFrame):
    """Show table with checkboxes for selecting rows"""
    if df.empty:
        st.info(f"No {collection} recorded.")
        return

    selected = []
    df_display = df.copy()

    # Add checkbox per row
    for rid in df_display.index:
        checkbox = st.checkbox(f"Select {rid}", key=f"chk_{collection}_{rid}")
        if checkbox:
            selected.append(rid)

    st.dataframe(df_display, use_container_width=True)

    # Single Delete button for selected
    if selected:
        if st.button(f"🗑️ Delete Selected {collection.title()}"):
            delete_records(collection, selected)

# =============================================
# 7. GOATS TABLE
# =============================================
with tabs[0]:
    st.subheader("Goats")
    if goats:
        goat_list = []
        for rid, g in goats.items():
            goat_list.append({
                "Tag": g.get("tag_number", "—"),
                "Breed": g.get("breed", "—"),
                "Gender": g.get("gender", "—"),
                "DOB": g.get("dob", "—")
            })
        df_goats = pd.DataFrame(goat_list, index=list(goats.keys()))
        show_table_with_checkbox("goats", df_goats)
    else:
        st.info("No goats yet.")

# =============================================
# 8. BREEDING TABLE
# =============================================
with tabs[1]:
    st.subheader("Breeding & Births")
    if breeding:
        breed_list = []
        for rid, b in breeding.items():
            try:
                exp = datetime.fromisoformat(b.get("expected_birth", "").split("T")[0])
                days_left = (exp.date() - datetime.now().date()).days
            except:
                days_left = "—"
            breed_list.append({
                "Female": b.get("female_id", "—"),
                "Male": b.get("male_id", "—"),
                "Mated": b.get("mating_date", "—"),
                "Expected": b.get("expected_birth", "—"),
                "Days Left": days_left
            })
        df_breeding = pd.DataFrame(breed_list, index=list(breeding.keys()))
        show_table_with_checkbox("breeding", df_breeding)
    else:
        st.info("No breeding records.")

# =============================================
# 9. HEALTH TABLE
# =============================================
with tabs[2]:
    st.subheader("Health Records")
    if health:
        health_list = []
        for rid, h in health.items():
            health_list.append({
                "Goat": h.get("goat_id", "—"),
                "Condition": h.get("condition", "—"),
                "Treatment": h.get("treatment", "—"),
                "Date": h.get("checkup_date", "—")
            })
        df_health = pd.DataFrame(health_list, index=list(health.keys()))
        show_table_with_checkbox("health", df_health)
    else:
        st.info("No health records.")

# =============================================
# 10. SALES TABLE
# =============================================
with tabs[3]:
    st.subheader("Sales")
    if sales:
        sales_list = []
        for rid, s in sales.items():
            sales_list.append({
                "Goat": s.get("goat_id", "—"),
                "Buyer": s.get("buyer_name", "—"),
                "Price": f"Ksh {s.get('price', 0):,}",
                "Date": s.get("sale_date", "—")
            })
        df_sales = pd.DataFrame(sales_list, index=list(sales.keys()))
        show_table_with_checkbox("sales", df_sales)
    else:
        st.info("No sales yet.")

# =============================================
# 11. WORKERS TABLE
# =============================================
with tabs[4]:
    st.subheader("Farm Workers")
    if workers:
        worker_list = []
        for rid, w in workers.items():
            worker_list.append({
                "Name": w.get("full_name", "—"),
                "Phone": w.get("phone", "—"),
                "Location": w.get("location", "—")
            })
        df_workers = pd.DataFrame(worker_list, index=list(workers.keys()))
        show_table_with_checkbox("user_profile", df_workers)
    else:
        st.info("No workers added.")

# =============================================
# 12. AI RECOMMENDATIONS
# =============================================
with tabs[5]:
    st.subheader("AI Farm Advisor")
    recs = []

    # Pregnant goats
    if breeding:
        today = datetime.now().date()
        due_soon = 0
        for b in breeding.values():
            try:
                exp = datetime.fromisoformat(b.get("expected_birth", "").split("T")[0]).date()
                days = (exp - today).days
                if days <= 7:
                    due_soon += 1
            except:
                pass
        if due_soon:
            recs.append(f"{due_soon} goat(s) due in 7 days — prepare delivery!")
        else:
            recs.append("No immediate births.")

    # Health
    sick = len([h for h in health.values() if h.get("condition", "").lower() in ["sick", "weak"]])
    if sick:
        recs.append(f"{sick} goat(s) need urgent care.")
    else:
        recs.append("All goats healthy.")

    # Sales
    total = sum(float(s.get("price", 0)) for s in sales.values())
    recs.append(f"Total sales: **Ksh {total:,.0f}**")

    # Herd
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
            d = st.date_input("Check-up")
            if st.form_submit_button("Save"):
                if g:
                    add_record("health", {
                        "goat_id": g, "condition": c, "treatment": t,
                        "checkup_date": str(d)
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
                        "goat_id": g, "buyer_name": b, "price": p,
                        "sale_date": str(d)
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
