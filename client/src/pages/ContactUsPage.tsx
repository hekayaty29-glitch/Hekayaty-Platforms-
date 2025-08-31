import { useState } from 'react';
import { Link } from 'wouter';

export default function ContactUsPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Form submission logic will be handled by Formspree
    const form = e.target as HTMLFormElement;
    form.submit();
  };

  return (
    <div className="min-h-screen text-amber-50 py-12 px-4" style={{ backgroundColor: '#151008' }}>
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-cinzel text-4xl font-bold mb-4">📬 اتصل بنا</h1>
          <p className="text-lg text-amber-100 mb-6">
            مرحبًا بك في Hekayaty! هل لديك سؤال، اقتراح، مشكلة؟ يسعدنا دائمًا أن نستمع إليك.
          </p>
          <p className="text-amber-200 mb-8">
            املأ النموذج أو تواصل معنا مباشرة عبر الوسائل التالية.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Contact Form */}
          <div className="bg-midnight-blue/50 backdrop-blur-sm rounded-xl p-8 border border-amber-900/30">
            <h2 className="font-cinzel text-2xl font-bold mb-6 text-amber-100">أرسل لنا رسالة</h2>
            <form 
              action="https://formspree.io/f/meokpzko"
              method="POST"
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              <div>
                <label htmlFor="name" className="block text-amber-100 mb-2">الاسم</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-gray-800 border border-amber-900/30 rounded-lg px-4 py-2 text-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-amber-100 mb-2">البريد الإلكتروني</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-gray-800 border border-amber-900/30 rounded-lg px-4 py-2 text-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="subject" className="block text-amber-100 mb-2">الموضوع</label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full bg-gray-800 border border-amber-900/30 rounded-lg px-4 py-2 text-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                >
                  <option value="">اختر الموضوع</option>
                  <option value="استفسار">استفسار</option>
                  <option value="مقترح">مقترح</option>
                  <option value="مشكلة">مشكلة</option>
                  <option value="آراء">آراء واقتراحات</option>
                  <option value="أخرى">أخرى</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="message" className="block text-amber-100 mb-2">الرسالة</label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full bg-gray-800 border border-amber-900/30 rounded-lg px-4 py-2 text-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                ></textarea>
              </div>
              
              <button
                type="submit"
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                إرسال الرسالة
              </button>
            </form>
          </div>

          {/* Contact Info */}
          <div className="space-y-8">
            <div className="bg-midnight-blue/50 backdrop-blur-sm rounded-xl p-8 border border-amber-900/30">
              <h2 className="font-cinzel text-2xl font-bold mb-6 text-amber-100">معلومات التواصل</h2>
              
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="bg-amber-900/30 p-3 rounded-lg mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-amber-100">وسائل التواصل الاجتماعي</h3>
                    <div className="flex space-x-4 mt-2">
                      <a href="https://www.facebook.com/profile.php?id=61577990000626" target="_blank" rel="noopener noreferrer" className="text-amber-300 hover:text-amber-400 transition-colors">
                        <span className="sr-only">Facebook</span>
                        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                        </svg>
                      </a>
                      <a href="https://www.youtube.com/@Hekayaty-q2i" target="_blank" rel="noopener noreferrer" className="text-amber-300 hover:text-amber-400 transition-colors">
                        <span className="sr-only">YouTube</span>
                        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path fillRule="evenodd" d="M19.8 7.8c-.2-1.3-.7-2.2-1.3-2.8-.6-.6-1.5-1.1-2.8-1.3C13.5 3.4 12 3.4 12 3.4s-1.5 0-3.7.3c-1.3.2-2.2.7-2.8 1.3-.6.6-1.1 1.5-1.3 2.8C3.4 10 3.4 12 3.4 12s0 1.9.3 3.7c.2 1.3.7 2.2 1.3 2.8.6.6 1.5 1.1 2.8 1.3 2.2.3 3.7.3 3.7.3s1.5 0 3.7-.3c1.3-.2 2.2-.7 2.8-1.3.6-.6 1.1-1.5 1.3-2.8.3-1.8.3-3.7.3-3.7s0-1.9-.3-3.7zM10 15V9l5.2 3-5.2 3z" clipRule="evenodd" />
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4">
                  <p className="text-amber-200">سيتم الرد على استفساراتك في غضون 24-48 ساعة.</p>
                </div>
              </div>
            </div>
            
            <div className="bg-midnight-blue/50 backdrop-blur-sm rounded-xl p-6 border border-amber-900/30">
              <h3 className="font-cinzel text-xl font-bold mb-4 text-amber-100">الأسئلة الشائعة</h3>
              <p className="text-amber-200 mb-4">هل لديك استفسار شائع؟ قد تجد إجابته هنا:</p>
              <Link 
                href="/faq" 
                className="text-amber-400 hover:text-amber-300 font-medium flex items-center"
              >
                تصفح الأسئلة الشائعة
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 transform -scale-x-100" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
