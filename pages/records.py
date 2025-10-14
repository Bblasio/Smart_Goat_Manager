import streamlit as st
import pyrebase
import datetime
import uuid

# =========================
# Firebase Configuration
# =========================
firebaseConfig = {
    "apiKey": "AIzaSyCCwzzr-F8qgDVwPK6xSy2mGLUulQ9F3bE",
    "authDomain": "goat-smart-farm.firebaseapp.com",
    "databaseURL": "https://goat-smart-farm-default-rtdb.firebaseio.com/",
    "projectId": "goat-smart-farm",
    "storageBucket": "goat-smart-farm.appspot.com",
    "messagingSenderId": "595909170929",
    "appId": "1:595909170929:web:db210c5ec8e6cd1c539ae4"
}

firebase = pyrebase.initialize_app(firebaseConfig)
db = firebase.database()

# =========================
# Helpers
# =========================
def generate_id():
    return str(uuid.uuid4())

def add_record(collection, data):
    record_id = generate_id()
    db.child(collection).child(record_id).set(data)
    st.success(f"{collection.capitalize()} record added successfully ✅")

def delete_record(collection, record_id, record_name="record"):
    try:
        record_ref = db.child(collection).child(record_id)
        record_data = record_ref.get().val()

        if record_data is not None:
            record_ref.remove()
            st.success(f"✅ {record_name} deleted from {collection.capitalize()}")
            st.experimental_rerun()
        else:
            st.warning("⚠️ Record already deleted or does not exist.")
    except Exception as e:
        st.error(f"❌ Error deleting record: {e}")

def get_records(collection):
    records = db.child(collection).get()
    return records.val() if records.val() else {}

# =========================
# CSS for Floating Button
# =========================
st.markdown(
    """
    <style>
    .floating-btn {
        position: fixed;
        bottom: 30px;
        right: 30px;
        background-color: white;
        color: black;
        border: none;
        border-radius: 50%;
        width: 60px;
        height: 60px;
        font-size: 30px;
        cursor: pointer;
        box-shadow: 0px 4px 10px rgba(0,0,0,0.3);
        transition: 0.3s;
    }
    .floating-btn:hover {
        background-color: #f0f0f0;
    }
    </style>
    """,
    unsafe_allow_html=True
)

# =========================
# Main Page
# =========================
st.set_page_config(page_title="Farm Records", layout="wide")
st.title("📋 Farm Records Management")

tab1, tab2, tab3, tab4, tab5 = st.tabs(
    ["🐐 Goats", "🧬 Breeding", "🩺 Health", "💰 Sales", "👤 User Profile"]
)

# =========================
# Display Tables with Delete Confirmation
# =========================
with tab1:
    st.subheader("All Goats")
    goats = get_records("goats")
    if goats:
        for record_id, g in goats.items():
            col1, col2, col3, col4, col5 = st.columns(5)
            col1.write(f"🐐 {g['tag_number']}")
            col2.write(g['breed'])
            col3.write(g['gender'])
            col4.write(g['dob'])
            if col5.button("🗑️", key=f"del_goat_btn_{record_id}"):
                if st.confirm(f"Delete Goat {g['tag_number']}?"):
                    delete_record("goats", record_id, g['tag_number'])
    else:
        st.info("No goats found.")

with tab2:
    st.subheader("All Breeding Records")
    breeding = get_records("breeding")
    if breeding:
        for record_id, b in breeding.items():
            col1, col2, col3, col4, col5 = st.columns(5)
            col1.write(f"♀ {b['female_id']}")
            col2.write(f"♂ {b['male_id']}")
            col3.write(b['mating_date'])
            col4.write(b['expected_birth'])
            if col5.button("🗑️", key=f"del_breed_btn_{record_id}"):
                if st.confirm(f"Delete breeding record for Female {b['female_id']}?"):
                    delete_record("breeding", record_id, f"{b['female_id']}")
    else:
        st.info("No breeding records found.")

with tab3:
    st.subheader("All Health Records")
    health = get_records("health")
    if health:
        for record_id, h in health.items():
            col1, col2, col3, col4, col5 = st.columns(5)
            col1.write(h['goat_id'])
            col2.write(h['condition'])
            col3.write(h['treatment'])
            col4.write(h['checkup_date'])
            if col5.button("🗑️", key=f"del_health_btn_{record_id}"):
                if st.confirm(f"Delete health record for Goat {h['goat_id']}?"):
                    delete_record("health", record_id, f"{h['goat_id']}")
    else:
        st.info("No health records found.")

with tab4:
    st.subheader("All Sales Records")
    sales = get_records("sales")
    if sales:
        for record_id, s in sales.items():
            col1, col2, col3, col4, col5 = st.columns(5)
            col1.write(s['goat_id'])
            col2.write(s['buyer_name'])
            col3.write(f"Ksh {s['price']}")
            col4.write(s['sale_date'])
            if col5.button("🗑️", key=f"del_sale_btn_{record_id}"):
                if st.confirm(f"Delete sale record for Goat {s['goat_id']}?"):
                    delete_record("sales", record_id, f"{s['goat_id']}")
    else:
        st.info("No sales records found.")

with tab5:
    st.subheader("All User Profiles")
    users = get_records("user_profile")
    if users:
        for record_id, u in users.items():
            col1, col2, col3, col4 = st.columns(4)
            col1.write(u['full_name'])
            col2.write(u['phone'])
            col3.write(u['location'])
            if col4.button("🗑️", key=f"del_user_btn_{record_id}"):
                if st.confirm(f"Delete user {u['full_name']}?"):
                    delete_record("user_profile", record_id, u['full_name'])
    else:
        st.info("No user profiles found.")

# =========================
# Floating Add Button
# =========================
button_placeholder = st.empty()
button_placeholder.markdown(
    '<button class="floating-btn" onclick="window.location.reload()">+</button>',
    unsafe_allow_html=True
)

# =========================
# Sidebar for Adding Records
# =========================
with st.sidebar:
    st.subheader("➕ Add New Record")
    record_type = st.selectbox("Choose record type", ["", "Goat", "Breeding", "Health", "Sales", "User Profile"])

    if record_type == "Goat":
        tag = st.text_input("Tag Number")
        breed = st.text_input("Breed")
        gender = st.selectbox("Gender", ["Male", "Female"])
        dob = st.date_input("Date of Birth")
        if st.button("Save Goat"):
            add_record("goats", {
                "tag_number": tag,
                "breed": breed,
                "gender": gender,
                "dob": str(dob),
                "created_at": str(datetime.datetime.now())
            })

    elif record_type == "Breeding":
        female = st.text_input("Female ID")
        male = st.text_input("Male ID")
        mating_date = st.date_input("Mating Date")
        expected_birth = st.date_input("Expected Birth Date")
        if st.button("Save Breeding"):
            add_record("breeding", {
                "female_id": female,
                "male_id": male,
                "mating_date": str(mating_date),
                "expected_birth": str(expected_birth),
                "created_at": str(datetime.datetime.now())
            })

    elif record_type == "Health":
        goat = st.text_input("Goat ID")
        condition = st.text_input("Condition")
        treatment = st.text_input("Treatment")
        checkup_date = st.date_input("Checkup Date")
        if st.button("Save Health"):
            add_record("health", {
                "goat_id": goat,
                "condition": condition,
                "treatment": treatment,
                "checkup_date": str(checkup_date),
                "created_at": str(datetime.datetime.now())
            })

    elif record_type == "Sales":
        goat = st.text_input("Goat ID")
        buyer = st.text_input("Buyer Name")
        price = st.number_input("Price", min_value=0.0)
        sale_date = st.date_input("Sale Date")
        if st.button("Save Sale"):
            add_record("sales", {
                "goat_id": goat,
                "buyer_name": buyer,
                "price": price,
                "sale_date": str(sale_date),
                "created_at": str(datetime.datetime.now())
            })

    elif record_type == "User Profile":
        name = st.text_input("Full Name")
        phone = st.text_input("Phone Number")
        location = st.text_input("Location")
        if st.button("Save User"):
            add_record("user_profile", {
                "full_name": name,
                "phone": phone,
                "location": location,
                "created_at": str(datetime.datetime.now())
            })
