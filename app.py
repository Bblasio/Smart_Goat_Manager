# app.py
import streamlit as st
from streamlit_option_menu import option_menu
import pyrebase
import json

# -------------------------------------------------
# 1. Load Firebase config from Streamlit Secrets
# -------------------------------------------------
if "firebase_config" not in st.secrets:
    st.error("Missing `firebase_config` in Streamlit Secrets!")
    st.stop()

firebaseConfig = json.loads(st.secrets["firebase_config"])

# -------------------------------------------------
# 2. Initialise Pyrebase
# -------------------------------------------------
firebase = pyrebase.initialize_app(firebaseConfig)
auth = firebase.auth()
db = firebase.database()

# -------------------------------------------------
# 3. Page config
# -------------------------------------------------
st.set_page_config(page_title="Smart Goat Farm", page_icon="goat", layout="wide")

# -------------------------------------------------
# 4. Session state defaults
# -------------------------------------------------
defaults = {
    "authenticated": False,
    "show_signup": False,
    "show_reset": False,
    "farm_name": "",
    "selected_page": "Dashboard",
    "user": None,
}
for k, v in defaults.items():
    if k not in st.session_state:
        st.session_state[k] = v

# -------------------------------------------------
# 5. Helper: Parse Firebase Auth Errors
# -------------------------------------------------
def parse_auth_error(e):
    error_msg = str(e).lower()
    if "invalid" in error_msg and "password" in error_msg:
        return "Wrong password."
    if "user" in error_msg and "not found" in error_msg:
        return "Email not found."
    if "email" in error_msg and "already" in error_msg:
        return "Email already in use."
    if "weak" in error_msg or "least 6" in error_msg:
        return "Password too weak (min 6 chars)."
    if "network" in error_msg or "timeout" in error_msg:
        return "Network error – try again."
    return "Invalid email or password."

# -------------------------------------------------
# 6. Forgot Password Page
# -------------------------------------------------
def forgot_password_page():
    st.title("Reset Password")
    with st.form("reset_form"):
        email = st.text_input("Enter your email")
        if st.form_submit_button("Send Reset Link"):
            if not email.strip():
                st.error("Please enter your email.")
            else:
                try:
                    auth.send_password_reset_email(email)
                    st.success("Reset link sent! Check your email (including spam).")
                    st.info("You will be redirected to login in 5 seconds...")
                    st.session_state.show_reset = False
                    st.rerun()
                except Exception as e:
                    st.error(parse_auth_error(e))
    if st.button("Back to Login"):
        st.session_state.show_reset = False
        st.rerun()

# -------------------------------------------------
# 7. Login Page
# -------------------------------------------------
def login_page():
    st.title("Login to Your Farm")
    with st.form("login_form"):
        email = st.text_input("Email", placeholder="you@farm.com")
        pwd = st.text_input("Password", type="password")
        if st.form_submit_button("Login"):
            if not email or not pwd:
                st.error("Please fill in both fields.")
            else:
                try:
                    user = auth.sign_in_with_email_and_password(email, pwd)
                    uid = user["localId"]
                    id_token = user["idToken"]
                    farm = db.child("users").child(uid).child("farm_name").get(token=id_token).val()

                    st.session_state.update({
                        "authenticated": True,
                        "user": user,
                        "farm_name": farm or "My Farm",
                        "selected_page": "Dashboard",
                    })
                    st.success("Login successful! Welcome back.")
                    st.rerun()
                except Exception as e:
                    st.error(parse_auth_error(e))

    c1, c2 = st.columns(2)
    with c1:
        if st.button("Create Account"):
            st.session_state.show_signup = True
            st.rerun()
    with c2:
        if st.button("Forgot Password?"):
            st.session_state.show_reset = True
            st.rerun()

# -------------------------------------------------
# 8. Signup Page
# -------------------------------------------------
def signup_page():
    st.title("Create New Farm Account")
    with st.form("signup_form"):
        farm_name = st.text_input("Farm Name", placeholder="e.g. Sunny Goat Farm")
        email = st.text_input("Email", placeholder="you@farm.com")
        pwd = st.text_input("Password", type="password")
        if st.form_submit_button("Sign Up"):
            if not all([farm_name.strip(), email.strip(), pwd]):
                st.error("All fields are required.")
            elif len(pwd) < 6:
                st.error("Password must be at least 6 characters.")
            else:
                try:
                    user = auth.create_user_with_email_and_password(email, pwd)
                    uid = user["localId"]
                    id_token = user["idToken"]
                    db.child("users").child(uid).child("farm_name").set(farm_name.strip(), token=id_token)
                    st.success("Account created! Please log in.")
                    st.session_state.show_signup = False
                    st.rerun()
                except Exception as e:
                    st.error(parse_auth_error(e))
    if st.button("Back to Login"):
        st.session_state.show_signup = False
        st.rerun()

# -------------------------------------------------
# 9. Routing
# -------------------------------------------------
if st.session_state.show_signup:
    signup_page()
elif st.session_state.show_reset:
    forgot_password_page()
elif not st.session_state.authenticated:
    login_page()
else:
    # === GO TO PAGES FOLDER ===
    import os
    page_path = f"pages/{st.session_state.selected_page}.py"
    if os.path.exists(page_path):
        with open(page_path) as f:
            exec(f.read(), globals())
    else:
        st.error(f"Page '{st.session_state.selected_page}' not found.")

    # Sidebar
    with st.sidebar:
        st.markdown(f"### {st.session_state.farm_name}")
        if st.button("Logout"):
            for k in ["authenticated", "user", "farm_name"]:
                st.session_state[k] = None if k != "authenticated" else False
            st.session_state.selected_page = "Dashboard"
            st.rerun()

        st.session_state.selected_page = option_menu(
            "Navigation",
            ["Dashboard", "Manage Goats", "Breeding"],
            icons=["speedometer", "clipboard-data", "heart"],
            default_index=["Dashboard", "Manage Goats", "Breeding"]
            .index(st.session_state.selected_page),
        )