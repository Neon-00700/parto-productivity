// Original learning roadmap inspired by the topic/progression structure of Menschen.
// It intentionally does not reproduce textbook exercises or copyrighted passages.
export const GERMAN_LEVELS = [
  { id: 'A1.1', title: 'A1.1', locked: false, units: [
    ['1','سلام و معرفی','Begrüßung, نام، کشور و اطلاعات شخصی','سلام کردن، معرفی خود، پرسیدن حال و اطلاعات پایه'],
    ['2','من و خانواده','Familie & Personen','اعضای خانواده، شغل و توصیف افراد'],
    ['3','خرید و اشیا','Einkaufen & Gegenstände','قیمت، رنگ، اشیا و خریدهای روزمره'],
    ['4','خانه و محل زندگی','Wohnen','اتاق‌ها، وسایل خانه و توصیف محل زندگی'],
    ['5','کار و زندگی روزمره','Arbeit & Alltag','شغل‌ها، برنامه روزانه و زمان'],
    ['6','قرار و اوقات فراغت','Freizeit & Verabredungen','علایق، قرار گذاشتن و پیشنهاد دادن'],
    ['7','غذا و نوشیدنی','Essen & Trinken','غذا، نوشیدنی، سفارش و دعوت'],
    ['8','خدمات و شهر','Stadt & Dienstleistungen','مکان‌های شهری، سؤال پرسیدن و مسیر'],
    ['9','سلامتی و نیازهای روزمره','Gesundheit','بدن، حال بد، نیازها و قرار پزشکی ساده'],
    ['10','سفر و حمل‌ونقل','Reisen & Verkehr','وسیله نقلیه، بلیت و سفر'],
    ['11','گذشته و تجربه‌های ساده','Vergangenheit','گفتن کارهای انجام‌شده با ساختارهای پایه'],
    ['12','جشن‌ها و اتفاق‌ها','Feste & Ereignisse','تولد، مهمانی، اتفاق‌های روزمره و مرور'],
  ]},
  { id: 'A1.2', title: 'A1.2', locked: true, units: Array.from({length:7}, (_,i)=>[String(i+8), `درس ${i+8}`, 'موضوعات تکمیلی A1.2', 'فعالیت‌های شنیداری، گفتاری، خواندن و نوشتن']) },
  { id: 'A2.1', title: 'A2.1', locked: true, units: Array.from({length:7}, (_,i)=>[String(i+15), `درس ${i+15}`, 'موضوعات روزمره A2.1', 'گرامر و مهارت‌های چهارگانه']) },
  { id: 'A2.2', title: 'A2.2', locked: true, units: Array.from({length:7}, (_,i)=>[String(i+22), `درس ${i+22}`, 'موضوعات روزمره A2.2', 'گرامر و مهارت‌های چهارگانه']) },
  { id: 'B1.1', title: 'B1.1', locked: true, units: Array.from({length:6}, (_,i)=>[String(i+29), `درس ${i+29}`, 'ارتباط مستقل B1.1', 'متن، شنیدن، نوشتن و مکالمه']) },
  { id: 'B1.2', title: 'B1.2', locked: true, units: Array.from({length:6}, (_,i)=>[String(i+35), `درس ${i+35}`, 'ارتباط مستقل B1.2', 'مهارت‌های آزمون و کاربردی']) },
  { id: 'B2', title: 'B2', locked: true, units: Array.from({length:8}, (_,i)=>[String(i+41), `ماژول ${i+1}`, 'موضوعات پیشرفته B2', 'بحث، نوشتار و درک متن']) },
  { id: 'C1', title: 'C1', locked: true, units: Array.from({length:8}, (_,i)=>[String(i+49), `ماژول ${i+1}`, 'موضوعات پیشرفته C1', 'استدلال، نوشتار و زبان رسمی']) },
];

export const A1_1_VOCAB = [
  ['Hallo','سلام','Hallo! Ich heiße Ali.','A1.1','Begrüßung'],
  ['heißen','نام داشتن','Ich heiße Ali.','A1.1','Person'],
  ['kommen','آمدن / اهل بودن','Ich komme aus Iran.','A1.1','Person'],
  ['sprechen','صحبت کردن','Ich spreche Persisch.','A1.1','Sprachen'],
  ['die Familie','خانواده','Meine Familie ist groß.','A1.1','Familie'],
  ['der Beruf','شغل','Was ist dein Beruf?','A1.1','Beruf'],
  ['arbeiten','کار کردن','Ich arbeite am Montag.','A1.1','Alltag'],
  ['kaufen','خریدن','Ich kaufe Brot.','A1.1','Einkaufen'],
  ['die Wohnung','آپارتمان / خانه','Meine Wohnung ist klein.','A1.1','Wohnen'],
  ['die Zeit','زمان','Ich habe heute Zeit.','A1.1','Alltag'],
  ['essen','غذا خوردن','Wir essen zusammen.','A1.1','Essen'],
  ['trinken','نوشیدن','Ich trinke Wasser.','A1.1','Essen'],
  ['fahren','رفتن با وسیله نقلیه','Ich fahre mit dem Bus.','A1.1','Reisen'],
  ['heute','امروز','Heute lerne ich Deutsch.','A1.1','Zeit'],
  ['morgen','فردا','Morgen arbeite ich.','A1.1','Zeit'],
  ['gestern','دیروز','Gestern war ich zu Hause.','A1.1','Zeit'],
];

export const GRAMMAR_A1 = [
  ['Personalpronomen','ضمیرهای شخصی','ich, du, er/sie/es, wir, ihr, sie/Sie'],
  ['sein','فعل sein','ich bin, du bist, er ist ...'],
  ['haben','فعل haben','ich habe, du hast, er hat ...'],
  ['Präsens','صرف فعل در زمان حال','پایان‌های فعل و ساخت جمله ساده'],
  ['W-Fragen','سؤال‌های پرسشی','wer, was, wo, woher, wie, wann'],
  ['Ja/Nein-Fragen','سؤال بله/خیر','قرار گرفتن فعل در ابتدای سؤال'],
  ['der / die / das','حروف تعریف','شناخت جنس دستوری اسم‌ها'],
  ['kein / nicht','منفی‌سازی','منفی کردن اسم و جمله'],
  ['Akkusativ','حالت Akkusativ','کاربرد پایه مفعول مستقیم'],
  ['Modalverben','افعال وجهی','können, möchten و کاربردهای پایه'],
];

export const SKILLS = ['Vocabulary','Grammar','Listening','Speaking','Reading','Writing'];
