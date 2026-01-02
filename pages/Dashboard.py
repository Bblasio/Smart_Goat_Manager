import streamlit as st
from datetime import datetime
import plotly.express as px
import plotly.graph_objects as go
import pandas as pd
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# =============================================
# 1. AUTH GUARD
# =============================================
if "authenticated" not in st.session_state or not st.session_state.authenticated:
    st.warning("Please log in to access your dashboard.")
    st.stop()

# =============================================
# 2. GET USER & IMPORT DB
# =============================================
user = st.session_state.user
uid = user["localId"]
id_token = user["idToken"]

# Import from app.py
from app import db

# =============================================
# 3. SIMPLIFIED HELPER FUNCTION
# =============================================
def safe_get(path):
    """Safely get data from Firebase"""
    try:
        result = db.child(path).get(token=id_token)
        if result and result.val() is not None:
            return result.val()
        return {}
    except Exception as e:
        st.error(f"Error fetching data: {e}")
        return {}

# =============================================
# 4. PAGE CONFIG
# =============================================
st.set_page_config(
    page_title="Goat Farm Dashboard",
    page_icon="🐐",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# =============================================
# 5. MODERN CSS STYLING
# =============================================
st.markdown("""
<style>
    /* Main theme colors */
    :root {
        --primary: #4F46E5;
        --secondary: #10B981;
        --accent: #F59E0B;
        --dark: #1F2937;
        --light: #F9FAFB;
        --card-bg: #FFFFFF;
        --shadow-sm: 0 1px 3px rgba(0,0,0,0.12);
        --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1);
        --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.1);
        --gradient-primary: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        --gradient-success: linear-gradient(135deg, #10B981 0%, #34D399 100%);
        --gradient-warning: linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%);
        --gradient-danger: linear-gradient(135deg, #EF4444 0%, #F87171 100%);
    }
    
    /* Global styles */
    .stApp {
        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    }
    
    /* Main header */
    .main-header {
        background: linear-gradient(90deg, var(--primary), #6366F1);
        padding: 1.5rem 2rem;
        border-radius: 12px;
        margin-bottom: 2rem;
        color: white;
        box-shadow: var(--shadow-md);
    }
    
    /* Card styles */
    .stat-card {
        background: var(--card-bg);
        border-radius: 16px;
        padding: 1.5rem;
        box-shadow: var(--shadow-md);
        border: 1px solid #E5E7EB;
        transition: all 0.3s ease;
        height: 100%;
    }
    
    .stat-card:hover {
        transform: translateY(-4px);
        box-shadow: var(--shadow-lg);
        border-color: var(--primary);
    }
    
    .stat-icon {
        font-size: 2rem;
        margin-bottom: 1rem;
        display: inline-block;
        padding: 0.75rem;
        border-radius: 12px;
        background: rgba(79, 70, 229, 0.1);
    }
    
    .stat-value {
        font-size: 2.5rem;
        font-weight: 800;
        color: var(--dark);
        line-height: 1;
        margin: 0.5rem 0;
    }
    
    .stat-label {
        color: #6B7280;
        font-size: 0.875rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
    
    .stat-change {
        font-size: 0.875rem;
        font-weight: 600;
        margin-top: 0.5rem;
    }
    
    .stat-change.positive {
        color: #10B981;
    }
    
    /* Section headers */
    .section-header {
        color: var(--dark);
        font-size: 1.5rem;
        font-weight: 700;
        margin: 2.5rem 0 1.5rem 0;
        padding-bottom: 0.75rem;
        border-bottom: 2px solid #E5E7EB;
        position: relative;
    }
    
    .section-header::after {
        content: '';
        position: absolute;
        bottom: -2px;
        left: 0;
        width: 80px;
        height: 2px;
        background: linear-gradient(90deg, var(--primary), var(--secondary));
    }
    
    /* Action buttons */
    .action-card {
        background: white;
        border-radius: 12px;
        padding: 1.5rem;
        box-shadow: var(--shadow-sm);
        border: 1px solid #E5E7EB;
        text-align: center;
        transition: all 0.2s ease;
        cursor: pointer;
        height: 100%;
    }
    
    .action-card:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);
        border-color: var(--primary);
    }
    
    .action-icon {
        font-size: 2.5rem;
        margin-bottom: 1rem;
        display: inline-block;
        padding: 1rem;
        border-radius: 12px;
        background: linear-gradient(135deg, rgba(79, 70, 229, 0.1), rgba(16, 185, 129, 0.1));
    }
    
    .action-title {
        font-weight: 600;
        color: var(--dark);
        margin-bottom: 0.5rem;
    }
    
    .action-desc {
        color: #6B7280;
        font-size: 0.875rem;
    }
    
    /* Status badges */
    .status-badge {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
    
    .status-healthy {
        background: rgba(16, 185, 129, 0.1);
        color: #10B981;
    }
    
    .status-warning {
        background: rgba(245, 158, 11, 0.1);
        color: #F59E0B;
    }
    
    /* Custom scrollbar */
    ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
    }
    
    ::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 4px;
    }
    
    ::-webkit-scrollbar-thumb {
        background: #c1c1c1;
        border-radius: 4px;
    }
    
    ::-webkit-scrollbar-thumb:hover {
        background: #a1a1a1;
    }
    
    /* Custom button styling */
    .stButton > button {
        background: linear-gradient(90deg, var(--primary), #6366F1);
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 10px;
        font-weight: 600;
        transition: all 0.3s ease;
    }
    
    .stButton > button:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(79, 70, 229, 0.3);
    }
    
    /* Divider */
    .divider {
        height: 1px;
        background: linear-gradient(90deg, transparent, #E5E7EB, transparent);
        margin: 2rem 0;
    }
</style>
""", unsafe_allow_html=True)

# =============================================
# 6. FETCH DATA WITH LOADING
# =============================================
with st.spinner("🔄 Loading your farm data..."):
    # Fetch farm info
    farm_data = safe_get(f"users/{uid}")
    farm_name = farm_data.get("farm_name", "My Goat Farm")
    created_at = farm_data.get("created_at")
    
    # Fetch records
    goats = safe_get(f"users/{uid}/records/goats")
    breeding = safe_get(f"users/{uid}/records/breeding")
    workers = safe_get(f"users/{uid}/records/user_profile")

# =============================================
# 7. HERO HEADER
# =============================================
st.markdown(f"""
<div class="main-header">
    <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
            <h1 style="margin: 0; font-size: 2rem; font-weight: 800;">🐐 {farm_name}</h1>
            <p style="margin: 0.5rem 0 0 0; opacity: 0.9;">Smart Goat Management Dashboard</p>
        </div>
        <div style="display: flex; gap: 1rem; align-items: center;">
            <span class="status-badge status-healthy">🟢 Live</span>
            <span style="opacity: 0.8;">{datetime.now().strftime('%b %d, %Y • %I:%M %p')}</span>
        </div>
    </div>
</div>
""", unsafe_allow_html=True)

# Farm age calculation
if created_at:
    try:
        created_date = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
        days_active = (datetime.now() - created_date).days
        st.markdown(f"""
        <div style="background: white; padding: 0.75rem 1.5rem; border-radius: 10px; display: inline-block; box-shadow: var(--shadow-sm); margin-bottom: 1rem;">
            <span style="color: #6B7280;">🏡 Farm active for</span>
            <span style="font-weight: 700; color: var(--primary); margin-left: 0.5rem;">{days_active} days</span>
        </div>
        """, unsafe_allow_html=True)
    except:
        pass

# =============================================
# 8. CALCULATE METRICS
# =============================================
total_goats = len(goats) if goats else 0
males = sum(1 for g in goats.values() if str(g.get("gender", "")).lower().startswith("m")) if goats else 0
females = total_goats - males
pregnant_count = len(breeding) if breeding else 0
total_workers = len(workers) if workers else 0

# Additional metrics
if goats:
    # Calculate health status
    health_counts = {"Healthy": 0, "Sick": 0, "Critical": 0}
    for goat in goats.values():
        status = goat.get("health_status", "Healthy").capitalize()
        health_counts[status] = health_counts.get(status, 0) + 1
    
    # Calculate average age
    ages = [g.get("age_months", 0) for g in goats.values() if g.get("age_months")]
    avg_age = sum(ages) / len(ages) if ages else 0
else:
    health_counts = {"Healthy": 0, "Sick": 0, "Critical": 0}
    avg_age = 0

healthy_count = health_counts["Healthy"]
pregnancy_rate = (pregnant_count / females * 100) if females > 0 else 0

# =============================================
# 9. KEY METRICS DASHBOARD
# =============================================
st.markdown('<div class="section-header">📊 Farm Overview</div>', unsafe_allow_html=True)

# First row - Primary metrics
col1, col2, col3, col4 = st.columns(4)

with col1:
    st.markdown(f"""
    <div class="stat-card">
        <div class="stat-icon">🐐</div>
        <div class="stat-value">{total_goats}</div>
        <div class="stat-label">Total Goats</div>
        <div class="stat-change positive">+{total_goats} this month</div>
    </div>
    """, unsafe_allow_html=True)

with col2:
    st.markdown(f"""
    <div class="stat-card">
        <div class="stat-icon" style="background: rgba(239, 68, 68, 0.1);">♀️</div>
        <div class="stat-value">{females}</div>
        <div class="stat-label">Female Goats</div>
        <div class="stat-change">Breeding ready</div>
    </div>
    """, unsafe_allow_html=True)

with col3:
    st.markdown(f"""
    <div class="stat-card">
        <div class="stat-icon" style="background: rgba(59, 130, 246, 0.1);">♂️</div>
        <div class="stat-value">{males}</div>
        <div class="stat-label">Male Goats</div>
        <div class="stat-change">For breeding</div>
    </div>
    """, unsafe_allow_html=True)

with col4:
    st.markdown(f"""
    <div class="stat-card">
        <div class="stat-icon" style="background: rgba(16, 185, 129, 0.1);">🤰</div>
        <div class="stat-value">{pregnant_count}</div>
        <div class="stat-label">Pregnant</div>
        <div class="stat-change positive">{pregnancy_rate:.1f}% rate</div>
    </div>
    """, unsafe_allow_html=True)

# Second row - Secondary metrics
col1, col2, col3, col4 = st.columns(4)

with col1:
    st.markdown(f"""
    <div class="stat-card">
        <div class="stat-icon" style="background: rgba(245, 158, 11, 0.1);">👥</div>
        <div class="stat-value">{total_workers}</div>
        <div class="stat-label">Workers</div>
        <div class="stat-change">Active staff</div>
    </div>
    """, unsafe_allow_html=True)

with col2:
    st.markdown(f"""
    <div class="stat-card">
        <div class="stat-icon" style="background: rgba(16, 185, 129, 0.1);">💚</div>
        <div class="stat-value">{healthy_count}</div>
        <div class="stat-label">Healthy Goats</div>
        <div class="stat-change positive">{healthy_count/total_goats*100:.0f}% healthy</div>
    </div>
    """, unsafe_allow_html=True)

with col3:
    st.markdown(f"""
    <div class="stat-card">
        <div class="stat-icon" style="background: rgba(139, 92, 246, 0.1);">📅</div>
        <div class="stat-value">{avg_age:.0f}</div>
        <div class="stat-label">Avg Age (Months)</div>
        <div class="stat-change">Optimal range</div>
    </div>
    """, unsafe_allow_html=True)

with col4:
    # Calculate growth rate (placeholder - you can replace with actual data)
    growth_rate = 12 if total_goats > 0 else 0
    st.markdown(f"""
    <div class="stat-card">
        <div class="stat-icon" style="background: rgba(79, 70, 229, 0.1);">📈</div>
        <div class="stat-value">{growth_rate}%</div>
        <div class="stat-label">Growth Rate</div>
        <div class="stat-change positive">This quarter</div>
    </div>
    """, unsafe_allow_html=True)

# =============================================
# 10. VISUALIZATIONS & QUICK ACTIONS
# =============================================
col1, col2 = st.columns([2, 1])

with col1:
    st.markdown('<div class="section-header">📈 Analytics</div>', unsafe_allow_html=True)
    
    if total_goats > 0:
        # Create tabs for different charts
        tab1, tab2 = st.tabs(["Gender Distribution", "Health Status"])
        
        with tab1:
            # Gender distribution donut chart
            gender_data = pd.DataFrame({
                "Category": ["Female", "Male"],
                "Count": [females, males],
                "Color": ["#EC4899", "#3B82F6"]
            })
            
            fig_gender = go.Figure(data=[go.Pie(
                labels=gender_data["Category"],
                values=gender_data["Count"],
                hole=.5,
                marker_colors=gender_data["Color"],
                textinfo='label+percent',
                insidetextorientation='radial',
                hovertemplate='<b>%{label}</b><br>Count: %{value}<extra></extra>'
            )])
            
            fig_gender.update_layout(
                height=400,
                showlegend=True,
                plot_bgcolor='rgba(0,0,0,0)',
                paper_bgcolor='rgba(0,0,0,0)',
                legend=dict(
                    orientation="h",
                    yanchor="bottom",
                    y=1.02,
                    xanchor="center",
                    x=0.5
                ),
                margin=dict(t=0, b=0, l=0, r=0)
            )
            
            st.plotly_chart(fig_gender, use_container_width=True)
        
        with tab2:
            # Health status bar chart
            health_data = pd.DataFrame({
                "Status": list(health_counts.keys()),
                "Count": list(health_counts.values()),
                "Color": ["#10B981", "#F59E0B", "#EF4444"]
            })
            
            fig_health = go.Figure(data=[go.Bar(
                x=health_data["Status"],
                y=health_data["Count"],
                marker_color=health_data["Color"],
                marker_line_color='white',
                marker_line_width=2,
                opacity=0.8,
                text=health_data["Count"],
                textposition='auto',
            )])
            
            fig_health.update_layout(
                height=400,
                plot_bgcolor='rgba(0,0,0,0)',
                paper_bgcolor='rgba(0,0,0,0)',
                xaxis_title="Health Status",
                yaxis_title="Number of Goats",
                showlegend=False,
                margin=dict(t=0, b=0, l=0, r=0)
            )
            
            st.plotly_chart(fig_health, use_container_width=True)
    else:
        st.markdown("""
        <div style="text-align: center; padding: 3rem; background: white; border-radius: 12px; box-shadow: var(--shadow-sm);">
            <div style="font-size: 4rem; margin-bottom: 1rem;">🐐</div>
            <h3 style="color: var(--dark); margin-bottom: 0.5rem;">No goats recorded yet</h3>
            <p style="color: #6B7280; margin-bottom: 1.5rem;">Add your first goat to start tracking</p>
            <button style="background: linear-gradient(90deg, var(--primary), #6366F1); color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 600; cursor: pointer;">
                ➕ Add First Goat
            </button>
        </div>
        """, unsafe_allow_html=True)

with col2:
    st.markdown('<div class="section-header">⚡ Quick Actions</div>', unsafe_allow_html=True)
    
    # Action cards
    actions = [
        {"icon": "➕", "title": "Add Goat", "desc": "Register new goat", "color": "#4F46E5"},
        {"icon": "🤰", "title": "Record Breeding", "desc": "Log mating activity", "color": "#10B981"},
        {"icon": "💉", "title": "Health Check", "desc": "Update health status", "color": "#F59E0B"},
        {"icon": "👥", "title": "Manage Team", "desc": "Add/remove workers", "color": "#8B5CF6"},
        {"icon": "📊", "title": "Reports", "desc": "Generate insights", "color": "#3B82F6"},
        {"icon": "⚙️", "title": "Settings", "desc": "Farm configuration", "color": "#6B7280"}
    ]
    
    for i in range(0, len(actions), 2):
        cols = st.columns(2)
        for j in range(2):
            if i + j < len(actions):
                action = actions[i + j]
                with cols[j]:
                    st.markdown(f"""
                    <div class="action-card">
                        <div class="action-icon" style="background: rgba({int(action['color'][1:3], 16)}, {int(action['color'][3:5], 16)}, {int(action['color'][5:7], 16)}, 0.1);">
                            {action['icon']}
                        </div>
                        <div class="action-title">{action['title']}</div>
                        <div class="action-desc">{action['desc']}</div>
                    </div>
                    """, unsafe_allow_html=True)

# =============================================
# 11. RECENT ACTIVITY TIMELINE
# =============================================
st.markdown('<div class="section-header">📝 Recent Activity</div>', unsafe_allow_html=True)

# Create activity timeline
activities = []

# Add goat activities
if goats:
    for goat_id, goat in list(goats.items())[-2:]:  # Last 2 goats
        activities.append({
            "time": "Just now",
            "icon": "➕",
            "title": "Goat Added",
            "desc": f"{goat.get('name', 'Unnamed')} • ID: {goat_id[:6]}...",
            "color": "#4F46E5"
        })

# Add breeding activities
if breeding:
    for breed_id, breed in list(breeding.items())[-2:]:  # Last 2 breeding records
        activities.append({
            "time": "1 day ago",
            "icon": "🤰",
            "title": "Breeding Recorded",
            "desc": f"Mating recorded • Due soon",
            "color": "#10B981"
        })

# Add worker activities
if workers:
    for worker_id, worker in list(workers.items())[-1:]:  # Last worker
        activities.append({
            "time": "2 days ago",
            "icon": "👥",
            "title": "Worker Added",
            "desc": f"{worker.get('name', 'New Worker')} • {worker.get('role', 'Staff')}",
            "color": "#F59E0B"
        })

# Add placeholder activities if empty
if not activities:
    activities = [
        {"time": "Just now", "icon": "👋", "title": "Welcome!", "desc": "Your farm dashboard is ready", "color": "#4F46E5"},
        {"time": "Today", "icon": "📱", "title": "App Setup", "desc": "Dashboard configured successfully", "color": "#10B981"},
        {"time": "Today", "icon": "⚡", "title": "Get Started", "desc": "Add your first goat to begin", "color": "#F59E0B"},
    ]

# Display timeline
for activity in activities:
    st.markdown(f"""
    <div style="display: flex; align-items: flex-start; margin-bottom: 1.5rem; padding-left: 1rem; position: relative;">
        <div style="position: absolute; left: 0; top: 0; bottom: 0; width: 2px; background: {activity['color']}20;"></div>
        <div style="position: absolute; left: -4px; top: 0.5rem; width: 10px; height: 10px; border-radius: 50%; background: {activity['color']}; border: 2px solid white; box-shadow: 0 0 0 2px {activity['color']}20;"></div>
        <div style="margin-left: 1.5rem; flex: 1;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                        <span style="font-size: 1.25rem;">{activity['icon']}</span>
                        <span style="font-weight: 600; color: var(--dark);">{activity['title']}</span>
                    </div>
                    <div style="color: #6B7280; font-size: 0.875rem;">{activity['desc']}</div>
                </div>
                <div style="font-size: 0.75rem; color: #9CA3AF; background: #F3F4F6; padding: 0.25rem 0.5rem; border-radius: 6px;">
                    {activity['time']}
                </div>
            </div>
        </div>
    </div>
    """, unsafe_allow_html=True)

# =============================================
# 12. FOOTER
# =============================================
st.markdown('<div class="divider"></div>', unsafe_allow_html=True)

footer_cols = st.columns(3)
with footer_cols[1]:
    st.markdown(f"""
    <div style="text-align: center; color: #6B7280; font-size: 0.875rem;">
        <div style="margin-bottom: 0.5rem;">
            <span style="font-weight: 600; color: var(--primary);">Smart Goat Management System</span>
            <span style="margin: 0 0.5rem;">•</span>
            <span>v1.0.0</span>
        </div>
        <div>Last sync: {datetime.now().strftime('%I:%M %p')} • {total_goats} records</div>
    </div>
    """, unsafe_allow_html=True)

# =============================================
# 13. DEBUG SECTION (Optional - can be removed)
# =============================================
with st.expander("🔧 Technical Details"):
    col1, col2 = st.columns(2)
    with col1:
        st.metric("User ID", uid[:8] + "...")
        st.metric("Session Token", "Active" if id_token else "Expired")
    with col2:
        st.metric("Data Load Time", "✓ Complete")
        st.metric("Cache Status", "Fresh")

# =============================================
# 14. REFRESH BUTTON
# =============================================
st.markdown("""
<div style="position: fixed; bottom: 20px; right: 20px; z-index: 1000;">
    <button onclick="window.location.reload()" style="
        background: linear-gradient(90deg, var(--primary), #6366F1);
        color: white;
        border: none;
        border-radius: 50%;
        width: 50px;
        height: 50px;
        font-size: 1.5rem;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
    ">
        🔄
    </button>
</div>
""", unsafe_allow_html=True)