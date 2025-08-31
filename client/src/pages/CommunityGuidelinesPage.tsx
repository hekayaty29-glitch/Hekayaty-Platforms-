import { Link } from 'wouter';
import { ChevronRight } from 'lucide-react';

export default function CommunityGuidelinesPage() {
  return (
    <div className="min-h-screen text-amber-50 py-12 px-4" style={{ backgroundColor: '#151008' }}>
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-cinzel text-4xl font-bold mb-4">📜 Hekayaty Community Guidelines</h1>
          <p className="text-lg text-amber-100">
            Welcome to the Hekayaty family! A place where we write, draw, discuss, and imagine our worlds together.
          </p>
        </div>

        {/* Introduction */}
        <div className="bg-midnight-blue/50 backdrop-blur-sm rounded-xl p-6 mb-8 border border-amber-900/30">
          <p className="text-amber-100 mb-6 text-lg leading-relaxed">
            مرحبًا بك في عائلة Hekayaty! هنا نكتب، نرسم، نناقش، ونتخيل سويًا عوالمنا الخاصة. لنجعل هذا المجتمع مساحة آمنة، مُلهمة، ومليئة بالإبداع — نرجو الالتزام بالإرشادات التالية:
          </p>
        </div>

        {/* Guidelines Sections */}
        <div className="space-y-8">
          {/* Respect Section */}
          <SectionCard 
            icon="🤝"
            title="أولًا: الاحترام أساس كل شيء"
            items={[
              "نتعامل مع بعضنا بلغة راقية ومُحترمة، حتى في الخلافات.",
              "نرحّب بجميع الآراء ما دامت تُقدَّم بأدب وبدون تهجّم أو تقليل.",
              "لا مكان لأي نوع من العنصرية أو التنمّر أو الإهانة أو التحريض على الكراهية."
            ]}
          />

          {/* Discussions Section */}
          <SectionCard 
            icon="💬"
            title="قسم النقاشات (Discussions):"
            items={[
              "ناقش القصص، الشخصيات، الحبكات، والمواضيع الأدبية بحرية.",
              "تأكد من أن مشاركتك تساهم بشكل إيجابي في الحوار.",
              "ممنوع نشر الإعلانات أو الروابط الدعائية دون إذن من الإدارة.",
              "لا تكشف أحداث مهمة (spoilers) بدون تنبيه واضح!"
            ]}
          />

          {/* Writing Workshops Section */}
          <SectionCard 
            icon="✍️"
            title="ورش الكتابة (Writing Workshops):"
            items={[
              "شارك أعمالك الكتابية لتطويرها، واستقبل النقد البنّاء بصدر رحب.",
              "لا تسرق أو تنسخ أعمال الآخرين. كل ما يُنشر يجب أن يكون من إنتاجك أو بتصريح.",
              "التفاعل والتشجيع على الأعمال المميزة جزء أساسي من روح الورشة!",
              "لا تنشر نصوصًا تحتوي على محتوى عنيف أو حساس دون تحذير مناسب."
            ]}
          />

          {/* Art Gallery Section */}
          <SectionCard 
            icon="🎨"
            title="معرض الفن (Art Gallery):"
            items={[
              "شارك رسوماتك، تصميماتك، وكل ما يتعلق بعوالم Hekayaty البصرية.",
              "يُسمح فقط بنشر الفن الأصلي أو الأعمال المستوحاة من قصص Hekayaty مع ذكر المصدر.",
              "ممنوع تمامًا استخدام صور من الإنترنت دون حقوق أو من مواقع مقرصنة."
            ]}
          />

          {/* Clubs Section */}
          <SectionCard 
            icon="📚"
            title="الأندية (Clubs):"
            items={[
              "الأندية هي مساحات للتفاعل حسب الاهتمامات (روايات رومانسية، فانتازيا، كتابة، قراءة جماعية… إلخ).",
              "التفاعل داخل الأندية يجب أن يظل ضمن الأدب والاحترام المتبادل.",
              "يُمنع تحويل الأندية لساحات جدل أو نشر محتوى غير متعلق بموضوع النادي."
            ]}
          />

          {/* General Prohibitions */}
          <div className="bg-red-900/20 border border-red-900/30 rounded-xl p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center">
              <span className="mr-2">🚫</span>
              <span>ممنوعات عامة:</span>
            </h3>
            <ul className="space-y-3 list-disc list-inside text-amber-100">
              <li>نشر أو الترويج لأي محتوى سياسي أو ديني جدلي.</li>
              <li>نشر معلومات شخصية (رقم هاتف، عنوان، إلخ) سواء لك أو لغيرك.</li>
              <li>استخدام أكثر من حساب بطريقة تؤثر على التفاعل أو التصويت.</li>
            </ul>
          </div>

          {/* Tips Section */}
          <div className="bg-amber-900/10 border border-amber-900/30 rounded-xl p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center">
              <span className="mr-2">🌟</span>
              <span>نصائح لتجعل تجربتك أجمل:</span>
            </h3>
            <ul className="space-y-3 list-disc list-inside text-amber-100">
              <li>اقرأ أعمال الآخرين وادعمهم.</li>
              <li>اسأل، اطلب رأي، شارك أفكارك… فأنت جزء من هذه العائلة 💖</li>
              <li>بلّغ الإدارة عن أي محتوى مخالف بهدوء، وسنأخذ الأمر بجدية.</li>
            </ul>
          </div>

          {/* Closing */}
          <div className="text-center mt-12 mb-8">
            <div className="text-4xl mb-4">🧚</div>
            <p className="text-xl font-cinzel text-amber-100 mb-4">
              Hekayaty مش بس منصة روايات، دي مدينة خيالك الخاصة.
            </p>
            <p className="text-lg text-amber-200 mb-6">
              خلي وجودك فيها نور، وكلامك فيها إلهام، وكتابتك فيها أثر ✨
            </p>
            <p className="text-amber-300">
              شكرًا لكونك جزء من هذه الرحلة الرائعة.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Reusable Section Component
function SectionCard({ icon, title, items }: { icon: string; title: string; items: string[] }) {
  return (
    <div className="bg-midnight-blue/50 backdrop-blur-sm rounded-xl p-6 border border-amber-900/30">
      <h3 className="text-xl font-bold mb-4 flex items-center">
        <span className="ml-2">{icon}</span>
        <span>{title}</span>
      </h3>
      <ul className="space-y-3 list-disc list-inside text-amber-100">
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
