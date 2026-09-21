import React, { useState } from 'react';
import {
  Bell,
  X,
  Baby,
  Syringe,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Info,
  Clock,
  ChevronRight,
  ShieldCheck,
  Check
} from 'lucide-react';
import { FarmNotification } from '../utils/notificationHelper';
import { AppView } from '../types';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: FarmNotification[];
  todayNotifications: FarmNotification[];
  upcomingNotifications: FarmNotification[];
  dismissedIds: string[];
  onDismiss: (id: string) => void;
  onDismissAllToday: () => void;
  onNavigate?: (view: AppView) => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  notifications,
  todayNotifications,
  upcomingNotifications,
  dismissedIds,
  onDismiss,
  onDismissAllToday,
  onNavigate,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'breeding' | 'vaccination'>('all');

  if (!isOpen) return null;

  // Filter out dismissed notifications
  const activeToday = todayNotifications.filter(n => !dismissedIds.includes(n.id));
  const activeUpcoming = upcomingNotifications.filter(n => !dismissedIds.includes(n.id));

  const filteredToday = activeFilter === 'all'
    ? activeToday
    : activeToday.filter(n => n.type === activeFilter);

  const filteredUpcoming = activeFilter === 'all'
    ? activeUpcoming
    : activeUpcoming.filter(n => n.type === activeFilter);

  const handleActionClick = (notif: FarmNotification) => {
    onClose();
    if (!onNavigate) return;
    if (notif.type === 'breeding') {
      onNavigate('breeding_estimator');
    } else if (notif.type === 'vaccination' || notif.type === 'health') {
      onNavigate('health_vet');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-start justify-center p-3 sm:p-6"
      onClick={onClose}
    >
      <div
        className="relative bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-6 animate-fade-in text-stone-900 dark:text-stone-100"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-800/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center relative">
              <Bell className="w-5 h-5" />
              {activeToday.length > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-rose-500 border-2 border-white dark:border-stone-900 animate-pulse" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-stone-900 dark:text-white">
                  Farm Alerts & Reminders
                </h3>
                {activeToday.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                    {activeToday.length} Due Today
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Scheduled breeding, kidding dates, and vaccination reminders
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-close-notification-modal"
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Bar & Quick Actions */}
        <div className="px-5 py-3 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              id="filter-notif-all"
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeFilter === 'all'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
              }`}
            >
              All Reminders ({activeToday.length + activeUpcoming.length})
            </button>
            <button
              type="button"
              id="filter-notif-breeding"
              onClick={() => setActiveFilter('breeding')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1 transition-all ${
                activeFilter === 'breeding'
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
              }`}
            >
              <Baby className="w-3.5 h-3.5" />
              <span>Breeding & Kidding</span>
            </button>
            <button
              type="button"
              id="filter-notif-vaccination"
              onClick={() => setActiveFilter('vaccination')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1 transition-all ${
                activeFilter === 'vaccination'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
              }`}
            >
              <Syringe className="w-3.5 h-3.5" />
              <span>Vaccination</span>
            </button>
          </div>

          {activeToday.length > 0 && (
            <button
              type="button"
              id="btn-dismiss-all-today"
              onClick={onDismissAllToday}
              className="text-xs text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 font-medium underline flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Acknowledge All Today</span>
            </button>
          )}
        </div>

        {/* Notifications Scrollable Content */}
        <div className="p-5 sm:p-6 max-h-[65vh] overflow-y-auto space-y-6">
          {/* SECTION 1: SCHEDULED FOR TODAY */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span>Scheduled for Today</span>
                <span className="text-stone-400 font-normal">({filteredToday.length})</span>
              </h4>
              <span className="text-[11px] text-stone-400 font-medium">
                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>

            {filteredToday.length === 0 ? (
              <div className="p-5 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/80 dark:border-stone-800 text-center space-y-1">
                <CheckCircle2 className="w-7 h-7 text-emerald-500 mx-auto" />
                <p className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                  No pending reminders scheduled for today!
                </p>
                <p className="text-[11px] text-stone-400">
                  All today's kidding dates and vaccination appointments are up-to-date.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredToday.map(notif => {
                  const isBreeding = notif.type === 'breeding';
                  return (
                    <div
                      key={notif.id}
                      className={`p-4 rounded-2xl border transition-all shadow-xs ${
                        isBreeding
                          ? 'bg-purple-50/60 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800/60'
                          : 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div
                            className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                              isBreeding
                                ? 'bg-purple-600 text-white shadow-2xs'
                                : 'bg-rose-600 text-white shadow-2xs'
                            }`}
                          >
                            {isBreeding ? (
                              <Baby className="w-5 h-5" />
                            ) : (
                              <Syringe className="w-5 h-5" />
                            )}
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                  isBreeding
                                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/80 dark:text-purple-200'
                                    : 'bg-rose-100 text-rose-800 dark:bg-rose-900/80 dark:text-rose-200'
                                }`}
                              >
                                {notif.badge}
                              </span>
                              {notif.goatId && (
                                <span className="px-1.5 py-0.5 rounded bg-stone-200/80 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-mono text-[10px] font-semibold">
                                  ID: {notif.goatId}
                                </span>
                              )}
                            </div>
                            <h5 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                              {notif.title}
                            </h5>
                            <p className="text-xs text-stone-600 dark:text-stone-300 mt-1 leading-relaxed">
                              {notif.message}
                            </p>
                            {notif.details && (
                              <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 font-mono">
                                ℹ️ {notif.details}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Dismiss button */}
                        <button
                          type="button"
                          onClick={() => onDismiss(notif.id)}
                          className="p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-200/60 dark:hover:bg-stone-800 rounded-lg transition-colors shrink-0"
                          title="Acknowledge and dismiss"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Action footer */}
                      <div className="mt-3 pt-3 border-t border-stone-200/70 dark:border-stone-800 flex items-center justify-between">
                        <span className="text-[11px] font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Action required today</span>
                        </span>

                        <button
                          type="button"
                          onClick={() => handleActionClick(notif)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300"
                        >
                          <span>{isBreeding ? 'View Breeding Predictor' : 'Open Health Records'}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SECTION 2: UPCOMING REMINDERS (1-3 DAYS) */}
          {filteredUpcoming.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-3 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Upcoming Reminders (Next 3 Days)</span>
                <span className="text-stone-400 font-normal">({filteredUpcoming.length})</span>
              </h4>

              <div className="space-y-2.5">
                {filteredUpcoming.map(notif => {
                  const isBreeding = notif.type === 'breeding';
                  return (
                    <div
                      key={notif.id}
                      className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-800 flex items-start justify-between gap-3 hover:border-stone-300 dark:hover:border-stone-700 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2 rounded-lg shrink-0 ${
                            isBreeding
                              ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300'
                              : 'bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300'
                          }`}
                        >
                          {isBreeding ? <Baby className="w-4 h-4" /> : <Syringe className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 font-mono">
                              {notif.date}
                            </span>
                            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                              Due in {notif.daysDiff} day{notif.daysDiff > 1 ? 's' : ''}
                            </span>
                          </div>
                          <h6 className="font-semibold text-xs text-stone-900 dark:text-stone-100">
                            {notif.title}
                          </h6>
                          <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                            {notif.message}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleActionClick(notif)}
                        className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline shrink-0 self-center font-medium"
                      >
                        Inspect →
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50 flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Reminders sync with live herd health and gestation records</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 text-stone-800 dark:text-stone-200 rounded-xl font-semibold text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
