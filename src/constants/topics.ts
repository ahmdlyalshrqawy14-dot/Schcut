export interface TopicPreset {
  id: string;
  topicAr: string;
  topicEn: string;
  categoryAr: string;
  categoryEn: string;
  icon: string;
}

export const TOPIC_PRESETS: TopicPreset[] = [
  {
    id: 'black-holes',
    topicAr: 'أسرار الثقوب السوداء وكيف تبتلع الضوء والوقت',
    topicEn: 'Secrets of Supermassive Black Holes & Time Distortion',
    categoryAr: 'العلوم والفضاء',
    categoryEn: 'Science & Space',
    icon: 'Sparkles',
  },
  {
    id: 'pyramids-engineering',
    topicAr: 'كيف بُنيت الأهرامات بدقة هندسية حيرت العلماء؟',
    topicEn: 'The Lost Ancient Engineering Behind the Great Pyramids',
    categoryAr: 'التاريخ والآثار',
    categoryEn: 'History & Archeology',
    icon: 'Landmark',
  },
  {
    id: 'deep-ocean',
    topicAr: 'كائنات غامضة تعيش في خندق ماريانا المظلم',
    topicEn: 'Terrifying Bioluminescent Creatures of the Mariana Trench',
    categoryAr: 'الطبيعة والبحار',
    categoryEn: 'Nature & Oceans',
    icon: 'Fish',
  },
  {
    id: 'quantum-realm',
    topicAr: 'غرائب فيزياء الكم: الجسيمات التي تتواجد في مكانين معاً',
    topicEn: 'Quantum Entanglement and the Paradox of Reality',
    categoryAr: 'الفيزياء',
    categoryEn: 'Quantum Physics',
    icon: 'Atom',
  },
  {
    id: 'alexandria-library',
    topicAr: 'لغز حريق مكتبة الإسكندرية وما فقدته البشرية من علوم',
    topicEn: 'The Great Mystery of the Burning of Library of Alexandria',
    categoryAr: 'التاريخ المفقود',
    categoryEn: 'Lost History',
    icon: 'BookOpen',
  },
  {
    id: 'james-webb',
    topicAr: 'اكتشافات تلسكوب جيمس ويب التي غيرت فهمنا للكون',
    topicEn: 'Mind-Blowing Deep Space Images from the James Webb Telescope',
    categoryAr: 'الفلك والكون',
    categoryEn: 'Astronomy & Cosmos',
    icon: 'Telescope',
  },
  {
    id: 'bermuda-triangle',
    topicAr: 'التفسير العلمي لحوادث اختفاء مثلث برمودا',
    topicEn: 'Scientific Explanations Behind the Bermuda Triangle Disappearances',
    categoryAr: 'ألغاز وظواهر',
    categoryEn: 'Mysteries & Phenomena',
    icon: 'Compass',
  },
  {
    id: 'ai-future',
    topicAr: 'مستقبل الذكاء الاصطناعي وكيف سيتفوق على الدماغ البشري',
    topicEn: 'The Rise of Artificial Superintelligence and the Human Brain',
    categoryAr: 'التكنولوجيا والمستقبل',
    categoryEn: 'Technology & Future',
    icon: 'Cpu',
  },
  {
    id: 'amazon-forest',
    topicAr: 'أسرار حضارات مجهولة مدفونة تحت رمال وغابات الأمازون',
    topicEn: 'Lost Ancient Megacities Discovered Under the Amazon Rainforest',
    categoryAr: 'الاستكشاف الجغرافي',
    categoryEn: 'Geographic Exploration',
    icon: 'Trees',
  },
  {
    id: 'voynich-manuscript',
    topicAr: 'مخطوطة فويتش: الكتاب المشفر الذي عجز العالم عن حله',
    topicEn: 'The Voynich Manuscript: The Unbreakable Code of History',
    categoryAr: 'مخطوطات وألغاز',
    categoryEn: 'Ancient Cryptography',
    icon: 'Scroll',
  },
];
