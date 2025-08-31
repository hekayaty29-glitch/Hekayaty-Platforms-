import { useState } from 'react';
import { Link } from 'wouter';

type FAQItem = {
  question: string;
  answer: string | JSX.Element;
};

type FAQCategory = {
  title: string;
  icon: string;
  items: FAQItem[];
};

export default function FAQPage() {
  const [expandedItems, setExpandedItems] = useState<{[key: string]: boolean}>({});

  const toggleItem = (categoryIndex: number, itemIndex: number) => {
    const key = `${categoryIndex}-${itemIndex}`;
    setExpandedItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const faqCategories: FAQCategory[] = [
    {
      title: '✨ عن المنصة',
      icon: '✨',
      items: [
        {
          question: 'ما هي منصة Hekayaty؟',
          answer: 'Hekayaty هي منصة عربية لقراءة وكتابة القصص والروايات بجميع أنواعها. تتيح لك استكشاف عوالم خيالية، نشر أعمالك الأدبية، والانضمام لمجتمع من الكتّاب والقراء.'
        },
        {
          question: 'هل المنصة مجانية؟',
          answer: 'نعم، يمكنك قراءة العديد من القصص مجانًا. كما نوفر باقات VIP بمزايا إضافية مثل القصص الحصرية، التصفح بدون إعلانات، وتجربة قراءة محسّنة.'
        }
      ]
    },
    {
      title: '📝 الكتابة والنشر',
      icon: '📝',
      items: [
        {
          question: 'كيف يمكنني نشر قصة على Hekayaty؟',
          answer: 'بعد إنشاء حساب، اذهب إلى قسم "قصصي" ثم اضغط على "أضف قصة جديدة"، وابدأ بكتابة العنوان والوصف ثم الفصول.'
        },
        {
          question: 'هل يمكنني تعديل قصتي بعد نشرها؟',
          answer: 'نعم، يمكنك تعديل القصة والفصول في أي وقت من خلال لوحة التحكم الخاصة بك.'
        },
        {
          question: 'هل هناك مراجعة للمحتوى قبل النشر؟',
          answer: 'القصص تُنشر مباشرة، لكن هناك فريق إشراف يراجع المحتوى ويحق له إزالة أو تعديل أي محتوى مخالف.'
        }
      ]
    },
    {
      title: '💳 الباقات والاشتراكات',
      icon: '💳',
      items: [
        {
          question: 'ما هي باقات الاشتراك المتوفرة؟',
          answer: 'لدينا باقة VIP بسعر 7 دولارات شهريًا، وتمنحك: الوصول للقصص الحصرية، تجربة بدون إعلانات، قراءة غير محدودة، وخصومات على المتجر والمسابقات.'
        },
        {
          question: 'هل يمكنني تجربة VIP مجانًا؟',
          answer: 'نعم، أول 100 مستخدم يحصلون على VIP مجانًا لمدة 3 شهور، وأول 300 يحصلون على شهر مجاني!'
        },
        {
          question: 'كيف يمكنني إلغاء الاشتراك؟',
          answer: 'يمكنك إلغاء الاشتراك في أي وقت من خلال إعدادات الحساب أو التواصل مع فريق الدعم.'
        }
      ]
    },
    {
      title: '🎨 المجتمع والمحتوى التفاعلي',
      icon: '🎨',
      items: [
        {
          question: 'ما هو قسم المجتمع؟',
          answer: 'هو مساحة للتفاعل بين المستخدمين: يمكنك مناقشة القصص، الانضمام لورش الكتابة، أندية القراءة، ومشاركة أعمالك الفنية في معرض الفن.'
        },
        {
          question: 'هل يمكنني التفاعل مع كتّاب آخرين؟',
          answer: 'نعم! يمكنك الإعجاب، التعليق، ومراسلة الكتّاب (حسب إعدادات الخصوصية).'
        },
        {
          question: 'هل يمكن لأي شخص المشاركة في الورش؟',
          answer: 'نعم، الورش مفتوحة للجميع، وبعضها مخصص لأعضاء VIP فقط.'
        }
      ]
    },
    {
      title: '📩 الدعم والمساعدة',
      icon: '📩',
      items: [
        {
          question: 'واجهت مشكلة، كيف أتواصل معكم؟',
          answer: 'يمكنك التواصل معنا من خلال صفحة Contact Us أو عبر البريد: support@hekayaty.com'
        },
        {
          question: 'هل هناك تطبيق لهواتف Android أو iOS؟',
          answer: 'جاري العمل على التطبيق، وسنعلن عنه فور إطلاقه بإذن الله.'
        },
        {
          question: 'هل يمكنني حذف حسابي؟',
          answer: 'نعم، يمكنك حذف حسابك نهائيًا من خلال الإعدادات، أو مراسلة الدعم لمساعدتك.'
        }
      ]
    },
    {
      title: '🔐 الخصوصية والأمان',
      icon: '🔐',
      items: [
        {
          question: 'هل بياناتي محفوظة؟',
          answer: 'نعم، نستخدم تقنيات حديثة لحماية بياناتك. لن نشارك معلوماتك مع أي طرف ثالث.'
        },
        {
          question: 'هل يمكنني التحكم في من يرى قصتي؟',
          answer: 'نعم، يمكنك جعل القصة خاصة أو عامة أو متاحة لمتابعيك فقط.'
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen text-amber-50 py-12 px-4" style={{ backgroundColor: '#151008' }}>
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-cinzel text-4xl font-bold mb-4">📚 الأسئلة الشائعة</h1>
          <p className="text-lg text-amber-100">
            ابحث عن إجابات لأسئلتك الشائعة حول منصة Hekayaty
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-12">
          <div className="relative">
            <input
              type="text"
              placeholder="ابحث في الأسئلة الشائعة..."
              className="w-full bg-gray-800 border border-amber-900/30 rounded-lg px-4 py-3 text-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500 pr-12"
              dir="rtl"
            />
            <svg
              className="absolute left-3 top-3.5 h-5 w-5 text-amber-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>

        {/* FAQ Categories */}
        <div className="space-y-8">
          {faqCategories.map((category, categoryIndex) => (
            <div key={categoryIndex} className="bg-midnight-blue/50 backdrop-blur-sm rounded-xl p-6 border border-amber-900/30">
              <h2 className="font-cinzel text-2xl font-bold mb-6 text-amber-100 flex items-center">
                <span className="ml-2">{category.icon}</span>
                {category.title}
              </h2>
              <div className="space-y-4">
                {category.items.map((item, itemIndex) => {
                  const key = `${categoryIndex}-${itemIndex}`;
                  const isExpanded = expandedItems[key];
                  
                  return (
                    <div 
                      key={itemIndex} 
                      className="border-b border-amber-900/30 pb-4 last:border-0 last:pb-0"
                    >
                      <button
                        onClick={() => toggleItem(categoryIndex, itemIndex)}
                        className="w-full flex justify-between items-center text-right focus:outline-none group"
                        aria-expanded={isExpanded}
                        aria-controls={`faq-${key}`}
                      >
                        <span className="font-medium text-amber-100 group-hover:text-amber-400 transition-colors">
                          {item.question}
                        </span>
                        <svg
                          className={`h-5 w-5 text-amber-400 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                      <div
                        id={`faq-${key}`}
                        className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'mt-3' : 'max-h-0'}`}
                        style={{
                          maxHeight: isExpanded ? '500px' : '0px',
                          opacity: isExpanded ? 1 : 0
                        }}
                      >
                        <p className="text-amber-200 pr-2">{item.answer}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="mt-12 text-center bg-amber-900/20 rounded-xl p-8 border border-amber-900/30">
          <h3 className="font-cinzel text-2xl font-bold mb-4">لم تجد إجابتك؟</h3>
          <p className="text-amber-200 mb-6">
            فريق الدعم لدينا مستعد لمساعدتك في أي استفسار آخر
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            تواصل معنا
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2 transform -scale-x-100"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
