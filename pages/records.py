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
# 3. PAGE COLOR THEME
# =============================================
PRIMARY_COLOR = "#2E8B57"  # green
ACCENT_COLOR = "#8B4513"   # brown
BACKGROUND_COLOR = "#F5F5F5"
TEXT_COLOR = "#1C1C1C"

st.markdown(f"""
    <style>
        /* Global Background */
        .stApp {{
            background-color: {BACKGROUND_COLOR};
            color: {TEXT_COLOR};
        }}

        /* Headings */
        h1, h2, h3, h4, h5, h6 {{
            color: {PRIMARY_COLOR} !important;
        }}

        /* Tabs */
        .stTabs [data-baseweb="tab-list"] button[aria-selected="true"] {{
            border-bottom: 3px solid {PRIMARY_COLOR};
            color: {PRIMARY_COLOR};
        }}

        /* Buttons */
        div.stButton > button {{
            background-color: {PRIMARY_COLOR};
            color: white;
            border-radius: 6px;
            border: none;
        }}
        div.stButton > button:hover {{
            background-color: {ACCENT_COLOR};
            color: white;
        }}

        /* Sidebar */
        section[data-testid="stSidebar"] {{
            background-color: #E8F5E9;
            color: {TEXT_COLOR};
        }}

        /* Info & success boxes */
        .stAlert > div {{
            background-color: #E8F5E9;
            color: {TEXT_COLOR};
            border-left: 5px solid {PRIMARY_COLOR};
        }}

        /* Divider color */
        hr {{
            border: 1px solid #DADADA;
        }}
    </style>
""", unsafe_allow_html=True)

# =============================================
# 4. HELPERS
# =============================================
def gen_id():
    return str(uuid.uuid4())

def add_record(collection: str, data: dict):
    rid = gen_id()
    db.child("users").child(uid).child("records").child(collection).child(rid).set(data, token=id_token)
    st.success(f"{collection.title()} added!")

def delete_record(collection: str, rid: str):
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
# 5. HANDLE QUERY PARAMS UPDATE
# =============================================
try:
    st.query_params
except AttributeError:
    st.query_params = st.experimental_get_query_params()

# =============================================
# 6. PAGE SETUP
# =============================================
st.set_page_config(page_title="Farm Records", layout="wide")
st.title("🐐 Farm Records & AI Insights")

tabs = st.tabs(["Goats", "Breeding", "Health", "Sales", "Workers", "AI Advisor"])

# =============================================
# 7. FETCH DATA
# =============================================
goats = get_records("goats")
breeding = get_records("breeding")
health = get_records("health")
sales = get_records("sales")
workers = get_records("user_profile")

# =============================================
# 8. DISPLAY FUNCTION (DELETE BUTTON PER ROW)
# =============================================
def show_table(collection: str, records: dict, columns: list):
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
        st.markdown(f"<hr style='border-color:{ACCENT_COLOR}; opacity:0.2;'>", unsafe_allow_html=True)

# =============================================
# 9–13. (Tabs content unchanged)
# =============================================
with tabs[0]:
    st.subheader("🐐 Goats")
    show_table("goats", goats, ["Tag_Number", "Breed", "Gender", "Dob"])

with tabs[1]:
    st.subheader("🧬 Breeding & Births")
    show_table("breeding", breeding, ["Female_Id", "Male_Id", "Mating_Date", "Expected_Birth"])

with tabs[2]:
    st.subheader("💊 Health Records")
    show_table("health", health, ["Goat_Id", "Condition", "Treatment", "Checkup_Date"])

with tabs[3]:
    st.subheader("💰 Sales")
    show_table("sales", sales, ["Goat_Id", "Buyer_Name", "Price", "Sale_Date"])

with tabs[4]:
    st.subheader("👷 Workers")
    show_table("user_profile", workers, ["Full_Name", "Phone", "Location"])

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
# 14. SIDEBAR FORM STYLING (unchanged)
# =============================================
with st.sidebar:
    st.subheader("➕ Add New Record")
    rec_type = st.selectbox("Select Type", ["", "Goat", "Breeding", "Health", "Sales", "Worker"])

    # (forms unchanged – same as before)
