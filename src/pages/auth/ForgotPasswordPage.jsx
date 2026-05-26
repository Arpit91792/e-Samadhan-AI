import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import AuthLayout from '../../components/auth/AuthLayout';
import { useAuth } from '../../context/AuthContext';

export default function ForgotPasswordPage() {
      const { forgotPassword } = useAuth();
      const { t } = useTranslation();
      const [email, setEmail] = useState('');
      const [loading, setLoading] = useState(false);
      const [sent, setSent] = useState(false);
      const [error, setError] = useState('');

      const handleSubmit = async (e) => {
            e.preventDefault();
            if (!email) { setError(t('validation.emailRequired')); return; }
            if (!/^\S+@\S+\.\S+$/.test(email)) { setError(t('validation.enterValidEmail')); return; }

            setLoading(true);
            setError('');
            try {
                  const data = await forgotPassword(email);
                  setSent(true);
                  toast.success(data.message);
            } catch (err) {
                  const msg = err.response?.data?.message || t('forgotPassword.somethingWrong');
                  setError(msg);
                  toast.error(msg);
            } finally {
                  setLoading(false);
            }
      };

      return (
            <AuthLayout
                  title={sent ? t('forgotPassword.checkEmail') : t('forgotPassword.title')}
                  subtitle={sent ? t('forgotPassword.sentTo', { email }) : t('forgotPassword.subtitle')}
            >
                  {sent ? (
                        <motion.div
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="text-center space-y-6"
                        >
                              <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                                    <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                              </div>
                              <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700 text-left">
                                    <p className="font-semibold mb-1">{t('forgotPassword.whatNext')}</p>
                                    <ol className="list-decimal list-inside space-y-1 text-blue-600">
                                          <li>{t('forgotPassword.step1', { email })}</li>
                                          <li>{t('forgotPassword.step2')}</li>
                                          <li>{t('forgotPassword.step3')}</li>
                                    </ol>
                              </div>
                              <p className="text-sm text-gray-500">
                                    {t('forgotPassword.didntReceive')}{' '}
                                    <button onClick={() => setSent(false)} className="text-blue-600 font-semibold hover:underline">
                                          {t('forgotPassword.tryAgain')}
                                    </button>
                              </p>
                              <Link to="/login">
                                    <motion.div
                                          whileHover={{ scale: 1.02 }}
                                          className="flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-bold rounded-xl text-sm cursor-pointer"
                                    >
                                          <ArrowLeft className="w-4 h-4" /> {t('forgotPassword.backToLogin')}
                                    </motion.div>
                              </Link>
                        </motion.div>
                  ) : (
                        <form onSubmit={handleSubmit} noValidate className="space-y-5">
                              {error && (
                                    <motion.div
                                          initial={{ opacity: 0, y: -10 }}
                                          animate={{ opacity: 1, y: 0 }}
                                          className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600"
                                    >
                                          {error}
                                    </motion.div>
                              )}

                              <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('auth.emailAddress')}</label>
                                    <div className="relative">
                                          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-[18px] h-[18px]" />
                                          <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                                                placeholder="you@example.com"
                                                autoComplete="email"
                                                className={`w-full pl-10 pr-4 py-3 bg-white border rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${error ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-blue-200 focus:border-blue-400'
                                                      }`}
                                          />
                                    </div>
                              </div>

                              <motion.button
                                    type="submit"
                                    disabled={loading}
                                    whileHover={!loading ? { scale: 1.02, boxShadow: '0 10px 30px rgba(37,99,235,0.35)' } : {}}
                                    whileTap={!loading ? { scale: 0.98 } : {}}
                                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-bold rounded-xl shadow-lg text-sm disabled:opacity-70 disabled:cursor-not-allowed"
                              >
                                    {loading ? (
                                          <><Loader2 className="w-4 h-4 animate-spin" /> {t('forgotPassword.sending')}</>
                                    ) : (
                                          <>{t('forgotPassword.sendResetLink')} <ArrowRight className="w-4 h-4" /></>
                                    )}
                              </motion.button>

                              <Link to="/login" className="flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors">
                                    <ArrowLeft className="w-4 h-4" /> {t('forgotPassword.backToLogin')}
                              </Link>
                        </form>
                  )}
            </AuthLayout>
      );
}
