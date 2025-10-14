# app.py

import streamlit as st
from streamlit_option_menu import option_menu
import pyrebase
from firebase_config import firebaseConfig

# ✅ Firebase setup
firebase = pyrebase.initialize_app(firebaseConfig)
auth = firebase.auth()
db = firebase.database()  # 👉 Realtime Database

# ✅ Page configuration
st.set_page_config(
    page_title="Smart Goat Farm",
    page_icon="🐐",
    layout="wide",
)

# ✅ Initialize session state
if "authenticated" not in st.session_state:
    st.session_state.authenticated = False
if "show_signup" not in st.session_state:
    st.session_state.show_signup = False
if "show_reset" not in st.session_state:
    st.session_state.show_reset = False
if "farm_name" not in st.session_state:
    st.session_state.farm_name = ""
if "selected_page" not in st.session_state:
    st.session_state.selected_page = "Dashboard"  # 👈 default landing page after login

# ✅ Forgot Password Page
def forgot_password_page():
    st.title("🔑 Reset Password")
    st.write("Enter your email and we’ll send you a reset link.")

    with st.form("reset_form"):
        email = st.text_input("Email")
        reset_btn = st.form_submit_button("Send Reset Link")

        if reset_btn:
            try:
                auth.send_password_reset_email(email)
                st.success("📩 Password reset email sent successfully!")
                st.session_state.show_reset = False
                st.rerun()
            except Exception as e:
                st.error("❌ Failed to send reset email. Check your email or try again.")

    if st.button("Back to Login"):
        st.session_state.show_reset = False
        st.rerun()

# ✅ Login Page
def login_page():
    st.title("🔐 Login to Smart Goat Farm")

    with st.form("login_form"):
        email = st.text_input("Email")
        password = st.text_input("Password", type="password")
        login_btn = st.form_submit_button("Login")

        if login_btn:
            try:
                user = auth.sign_in_with_email_and_password(email, password)
                st.session_state.authenticated = True
                st.session_state.user = user
                user_id = user["localId"]

                # ✅ Fetch farm name from Realtime Database
                farm_name = db.child("users").child(user_id).child("farm_name").get().val()
                st.session_state.farm_name = farm_name if farm_name else "My Farm"

                # 👇 Redirect user to Dashboard
                st.session_state.selected_page = "Dashboard"
                st.success("✅ Login successful! Redirecting to Dashboard...")
                st.rerun()

            except Exception:
                st.error("❌ Invalid credentials or user not found.")

    col1, col2 = st.columns(2)
    with col1:
        if st.button("📝 Create Account"):
            st.session_state.show_signup = True
            st.rerun()
    with col2:
        if st.button("🔑 Forgot Password"):
            st.session_state.show_reset = True
            st.rerun()

# ✅ Signup Page
def signup_page():
    st.title("📝 Create Account")

    with st.form("signup_form"):
        farm_name = st.text_input("Farm Name")
        email = st.text_input("Email")
        password = st.text_input("Password", type="password")
        signup_btn = st.form_submit_button("Sign Up")

        if signup_btn:
            if farm_name.strip() == "":
                st.error("❌ Farm name is required.")
            else:
                try:
                    user = auth.create_user_with_email_and_password(email, password)
                    user_id = user["localId"]

                    # ✅ Save farm name in Realtime Database
                    db.child("users").child(user_id).child("farm_name").set(farm_name)

                    st.success("✅ Account created successfully! You can now log in.")
                    st.session_state.show_signup = False
                    st.rerun()
                except Exception as e:
                    st.error("❌ Error creating account. Email might already be in use.")

    if st.button("Back to Login"):
        st.session_state.show_signup = False
        st.rerun()

# ✅ Logout Button
def logout_button():
    if st.sidebar.button("🚪 Logout"):
        st.session_state.authenticated = False
        st.session_state.user = None
        st.session_state.farm_name = ""
        st.session_state.selected_page = "Dashboard"
        st.rerun()

# ✅ Routing
if st.session_state.show_signup:
    signup_page()
elif st.session_state.show_reset:
    forgot_password_page()
elif not st.session_state.authenticated:
    login_page()
else:
    # ✅ Sidebar Navigation
    with st.sidebar:
        st.markdown(f"### 🐐 {st.session_state.farm_name}")
        logout_button()
        st.session_state.selected_page = option_menu(
            menu_title="Smart Goat Farm",
            options=["Dashboard", "Manage Goats", "Breeding"],
            icons=["speedometer", "clipboard-data", "heart"],
            menu_icon="cast",
            default_index=["Dashboard", "Manage Goats", "Breeding"].index(st.session_state.selected_page),
        )

    # ✅ Page Content
    if st.session_state.selected_page == "Dashboard":
        st.title(f"📊 Welcome to {st.session_state.farm_name} Farm")
        st.write("Here you will see total goats, breeding alerts, and activity charts.")

    elif st.session_state.selected_page == "Manage Goats":
        st.title("🐐 Manage Goats")
        st.write("Here you can add, view, and manage goat records.")

    elif st.session_state.selected_page == "Breeding":
        st.title("🧬 Breeding Management")
        st.write("Manage breeding pairs and predict birth dates using AI.")
