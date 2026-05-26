import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Zap, Mail, Phone, MapPin, Twitter, Linkedin, Github, Youtube, ArrowRight } from 'lucide-react';

export default function Footer() {
      const { t } = useTranslation();

      const quickLinks = [
            t('footer.quickLinksList.home'),
            t('footer.quickLinksList.features'),
            t('footer.quickLinksList.departments'),
            t('footer.quickLinksList.howItWorks'),
            t('footer.quickLinksList.analytics'),
            t('footer.quickLinksList.aboutUs'),
            t('footer.quickLinksList.blog'),
            t('footer.quickLinksList.careers'),
      ];

      const departments = [
            t('footer.deptList.electricity'),
            t('footer.deptList.waterSupply'),
            t('footer.deptList.roadsTransport'),
            t('footer.deptList.sanitation'),
            t('footer.deptList.police'),
            t('footer.deptList.healthcare'),
            t('footer.deptList.municipal'),
            t('footer.deptList.education'),
      ];

      return (
            <footer id="contact" className="bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 text-white relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
                  <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

                  <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="py-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
                              {/* Brand */}
                              <div className="lg:col-span-1">
                                    <div className="flex items-center gap-2.5 mb-5">
                                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg">
                                                <Zap className="w-5 h-5 text-white" fill="white" />
                                          </div>
                                          <div>
                                                <span className="font-black text-xl text-white">e-Samadhan</span>
                                                <span className="block text-[10px] font-semibold text-violet-400 tracking-widest uppercase">AI Platform</span>
                                          </div>
                                    </div>
                                    <p className="text-sm text-slate-400 leading-relaxed mb-6">{t('footer.brandDesc')}</p>
                                    <div className="flex gap-3">
                                          {[
                                                { Icon: Twitter, href: '#', label: 'Twitter' },
                                                { Icon: Linkedin, href: '#', label: 'LinkedIn' },
                                                { Icon: Github, href: '#', label: 'GitHub' },
                                                { Icon: Youtube, href: '#', label: 'YouTube' },
                                          ].map(({ Icon, href, label }) => (
                                                <motion.a key={label} href={href} aria-label={label}
                                                      whileHover={{ scale: 1.15, y: -2 }} whileTap={{ scale: 0.95 }}
                                                      className="w-9 h-9 rounded-xl bg-white/10 hover:bg-blue-600 flex items-center justify-center transition-colors duration-200">
                                                      <Icon className="w-4 h-4" />
                                                </motion.a>
                                          ))}
                                    </div>
                              </div>

                              {/* Quick Links */}
                              <div>
                                    <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-5">{t('footer.quickLinks')}</h4>
                                    <ul className="space-y-2.5">
                                          {quickLinks.map((link) => (
                                                <li key={link}>
                                                      <a href="#" className="text-sm text-slate-400 hover:text-blue-400 transition-colors flex items-center gap-1.5 group">
                                                            <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                            {link}
                                                      </a>
                                                </li>
                                          ))}
                                    </ul>
                              </div>

                              {/* Departments */}
                              <div>
                                    <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-5">{t('footer.departments')}</h4>
                                    <ul className="space-y-2.5">
                                          {departments.map((dept) => (
                                                <li key={dept}>
                                                      <a href="#" className="text-sm text-slate-400 hover:text-blue-400 transition-colors flex items-center gap-1.5 group">
                                                            <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                            {dept}
                                                      </a>
                                                </li>
                                          ))}
                                    </ul>
                              </div>

                              {/* Contact */}
                              <div>
                                    <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-5">{t('footer.contactUs')}</h4>
                                    <ul className="space-y-4 mb-6">
                                          <li className="flex items-start gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                      <MapPin className="w-4 h-4 text-blue-400" />
                                                </div>
                                                <span className="text-sm text-slate-400 leading-relaxed">{t('footer.address2')}</span>
                                          </li>
                                          <li className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center flex-shrink-0">
                                                      <Phone className="w-4 h-4 text-blue-400" />
                                                </div>
                                                <a href="tel:1800111555" className="text-sm text-slate-400 hover:text-blue-400 transition-colors">
                                                      {t('footer.tollFree')}
                                                </a>
                                          </li>
                                          <li className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center flex-shrink-0">
                                                      <Mail className="w-4 h-4 text-blue-400" />
                                                </div>
                                                <a href="mailto:support@esamadhan.gov.in" className="text-sm text-slate-400 hover:text-blue-400 transition-colors">
                                                      {t('footer.supportEmail')}
                                                </a>
                                          </li>
                                    </ul>

                                    <div>
                                          <p className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">{t('footer.stayUpdated')}</p>
                                          <div className="flex gap-2">
                                                <input type="email" placeholder={t('footer.yourEmail')}
                                                      className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors" />
                                                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                                                      className="px-3 py-2 bg-gradient-to-r from-blue-600 to-violet-600 rounded-xl">
                                                      <ArrowRight className="w-4 h-4" />
                                                </motion.button>
                                          </div>
                                    </div>
                              </div>
                        </div>

                        {/* Bottom bar */}
                        <div className="border-t border-white/10 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                              <p className="text-sm text-slate-500">{t('footer.copyrightFull')}</p>
                              <div className="flex gap-5">
                                    {[
                                          t('footer.legalLinks.privacy'),
                                          t('footer.legalLinks.terms'),
                                          t('footer.legalLinks.rti'),
                                          t('footer.legalLinks.accessibility'),
                                    ].map((link) => (
                                          <a key={link} href="#" className="text-xs text-slate-500 hover:text-blue-400 transition-colors">{link}</a>
                                    ))}
                              </div>
                        </div>
                  </div>
            </footer>
      );
}
