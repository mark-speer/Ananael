/**
 * King Wen hexagram excerpts (abbreviated Judgment & Image).
 * Numbers 1–64 follow the traditional King Wen sequence.
 */

export interface HexagramText {
  number: number;
  name: string;
  chinese: string;
  judgment: string;
  image: string;
}

export const HEXAGRAMS: HexagramText[] = [
  {
    number: 1,
    name: 'The Creative',
    chinese: '乾 Qián',
    judgment:
      'The Creative works sublime success, furthering through perseverance.',
    image:
      'The movement of heaven is full of power. Thus the superior person makes themselves strong and untiring.',
  },
  {
    number: 2,
    name: 'The Receptive',
    chinese: '坤 Kūn',
    judgment:
      'The Receptive brings sublime success, furthering through the perseverance of a mare. If the superior person undertakes something and tries to lead, they go astray; but if they follow, they find guidance.',
    image:
      'The earth\'s condition is receptive devotion. Thus the superior person who has breadth of character carries the outer world.',
  },
  {
    number: 3,
    name: 'Difficulty at the Beginning',
    chinese: '屯 Zhūn',
    judgment:
      'Difficulty at the Beginning works supreme success, furthering through perseverance. Nothing should be undertaken. It furthers one to appoint helpers.',
    image:
      'Clouds and thunder: Difficulty at the Beginning. Thus the superior person brings order out of confusion.',
  },
  {
    number: 4,
    name: 'Youthful Folly',
    chinese: '蒙 Méng',
    judgment:
      'Youthful Folly has success. It is not I who seek the young fool; the young fool seeks me. At the first oracle I inform them. If they ask two or three times, it is importunity.',
    image:
      'A spring wells up at the foot of the mountain: Youthful Folly. Thus the superior person fosters their character by thoroughness in all that they do.',
  },
  {
    number: 5,
    name: 'Waiting (Nourishment)',
    chinese: '需 Xū',
    judgment:
      'Waiting. If you are sincere, you have light and success. Perseverance brings good fortune. It furthers one to cross the great water.',
    image:
      'Clouds rise up to heaven: Waiting. Thus the superior person eats and drinks, is joyous and of good cheer.',
  },
  {
    number: 6,
    name: 'Conflict',
    chinese: '訟 Sòng',
    judgment:
      'Conflict. You are sincere and are being obstructed. A cautious halt halfway brings good fortune. Going through to the end brings misfortune. It furthers one to see the great person. It does not further one to cross the great water.',
    image:
      'Heaven and water go their opposite ways: Conflict. Thus in all their transactions the superior person carefully considers the beginning.',
  },
  {
    number: 7,
    name: 'The Army',
    chinese: '師 Shī',
    judgment:
      'The Army. The army needs perseverance and a strong person. Good fortune without blame.',
    image:
      'In the middle of the earth is water: The Army. Thus the superior person increases their masses by generosity toward the people.',
  },
  {
    number: 8,
    name: 'Holding Together (Union)',
    chinese: '比 Bǐ',
    judgment:
      'Holding Together brings good fortune. Inquire of the oracle once again whether you possess sublimity, constancy, and perseverance; then there is no blame. Those who are uncertain gradually join. Whoever comes too late meets with misfortune.',
    image:
      'On the earth is water: Holding Together. Thus the kings of antiquity bestowed the different states as fiefs and cultivated friendly relations with the feudal lords.',
  },
  {
    number: 9,
    name: 'The Taming Power of the Small',
    chinese: '小畜 Xiǎo Chù',
    judgment:
      'The Taming Power of the Small has success. Dense clouds, no rain from our western region.',
    image:
      'The wind drives across heaven: The Taming Power of the Small. Thus the superior person refines the outward aspect of their nature.',
  },
  {
    number: 10,
    name: 'Treading (Conduct)',
    chinese: '履 Lǚ',
    judgment:
      'Treading. Treading upon the tail of the tiger. It does not bite the person. Success.',
    image:
      'Heaven above, the lake below: Treading. Thus the superior person discriminates between high and low, and thereby fortifies the thinking of the people.',
  },
  {
    number: 11,
    name: 'Peace',
    chinese: '泰 Tài',
    judgment:
      'Peace. The small departs, the great approaches. Good fortune. Success.',
    image:
      'Heaven and earth unite: Peace. Thus the ruler divides and completes the course of heaven and earth; they further and regulate the gifts of heaven and earth, and so aid the people.',
  },
  {
    number: 12,
    name: 'Standstill (Stagnation)',
    chinese: '否 Pǐ',
    judgment:
      'Standstill. Evil people do not further the perseverance of the superior person. The great departs; the small approaches.',
    image:
      'Heaven and earth do not unite: Standstill. Thus the superior person falls back upon their inner worth in order to escape the difficulties. They do not permit themselves to be honored with revenue.',
  },
  {
    number: 13,
    name: 'Fellowship with Men',
    chinese: '同人 Tóng Rén',
    judgment:
      'Fellowship with Men in the open. Success. It furthers one to cross the great water. The perseverance of the superior person furthers.',
    image:
      'Heaven together with fire: Fellowship with Men. Thus the superior person organizes the clans and makes distinctions between things.',
  },
  {
    number: 14,
    name: 'Possession in Great Measure',
    chinese: '大有 Dà Yǒu',
    judgment: 'Possession in Great Measure. Supreme success.',
    image:
      'Fire in heaven above: Possession in Great Measure. Thus the superior person curbs evil and furthers good, and thereby obeys the benevolent will of heaven.',
  },
  {
    number: 15,
    name: 'Modesty',
    chinese: '謙 Qiān',
    judgment: 'Modesty creates success. The superior person carries things through.',
    image:
      'Within the earth, a mountain: Modesty. Thus the superior person reduces that which is too much, and augments that which is too little. They weigh things and make them equal.',
  },
  {
    number: 16,
    name: 'Enthusiasm',
    chinese: '豫 Yù',
    judgment:
      'Enthusiasm. It furthers one to install helpers and to set armies marching.',
    image:
      'Thunder comes resounding out of the earth: Enthusiasm. Thus the ancient kings made music in order to honor merit, and offered it with splendor to the Supreme Deity, inviting their ancestors to be present.',
  },
  {
    number: 17,
    name: 'Following',
    chinese: '隨 Suí',
    judgment: 'Following has supreme success. Perseverance furthers. No blame.',
    image:
      'Thunder in the middle of the lake: Following. Thus the superior person at nightfall goes indoors for rest and recuperation.',
  },
  {
    number: 18,
    name: 'Work on What Has Been Spoiled (Decay)',
    chinese: '蠱 Gǔ',
    judgment:
      'Work on What Has Been Spoiled has supreme success. It furthers one to cross the great water. Before the starting point, three days. After the starting point, three days.',
    image:
      'The wind blows low on the mountain: Work on What Has Been Spoiled. Thus the superior person stirs up the people and strengthens their spirit.',
  },
  {
    number: 19,
    name: 'Approach',
    chinese: '臨 Lín',
    judgment:
      'Approach has supreme success. Perseverance furthers. When the eighth month comes, there will be misfortune.',
    image:
      'The earth above the lake: Approach. Thus the superior person is inexhaustible in their will to teach, and without limits in their tolerance and protection of the people.',
  },
  {
    number: 20,
    name: 'Contemplation (View)',
    chinese: '觀 Guān',
    judgment:
      'Contemplation. The ablution has been made, but not yet the offering. Full of trust they look up to him.',
    image:
      'The wind blows over the earth: Contemplation. Thus the kings of old visited the regions of the world, contemplated the people, and gave them instruction.',
  },
  {
    number: 21,
    name: 'Biting Through',
    chinese: '噬嗑 Shì Kè',
    judgment: 'Biting Through has success. It is favorable to let justice be administered.',
    image:
      'Thunder and lightning: Biting Through. Thus the kings of former times made firm the laws through clearly defined penalties.',
  },
  {
    number: 22,
    name: 'Grace',
    chinese: '賁 Bì',
    judgment:
      'Grace has success. In small matters it is favorable to undertake something.',
    image:
      'Fire at the foot of the mountain: Grace. Thus does the superior person proceed when clearing up current affairs. But they dare not decide controversial issues in this way.',
  },
  {
    number: 23,
    name: 'Splitting Apart',
    chinese: '剝 Bō',
    judgment: 'Splitting Apart. It does not further one to go anywhere.',
    image:
      'The mountain rests on the earth: Splitting Apart. Thus those above can ensure their position only by giving generously to those below.',
  },
  {
    number: 24,
    name: 'Return (The Turning Point)',
    chinese: '復 Fù',
    judgment:
      'Return. Success. Going out and coming in without error. Friends come without blame. To and fro goes the way. On the seventh day comes return. It furthers one to have somewhere to go.',
    image:
      'Thunder within the earth: Return. Thus the kings of antiquity closed the passes at the time of solstice. Merchants and strangers did not go about, and the ruler did not travel through the provinces.',
  },
  {
    number: 25,
    name: 'Innocence (The Unexpected)',
    chinese: '無妄 Wú Wàng',
    judgment:
      'Innocence. Supreme success. Perseverance furthers. If someone is not as they should be, they have misfortune, and it does not further them to undertake anything.',
    image:
      'Under heaven thunder rolls: All things attain the natural state of innocence. Thus the kings of old, rich in virtue and in harmony with the time, fostered and nourished all beings.',
  },
  {
    number: 26,
    name: 'The Taming Power of the Great',
    chinese: '大畜 Dà Chù',
    judgment:
      'The Taming Power of the Great. Perseverance furthers. Not eating at home brings good fortune. It furthers one to cross the great water.',
    image:
      'Heaven within the mountain: The Taming Power of the Great. Thus the superior person acquaints themselves with the sayings of antiquity and many deeds of the past, in order to strengthen their character thereby.',
  },
  {
    number: 27,
    name: 'The Corners of the Mouth (Providing Nourishment)',
    chinese: '頤 Yí',
    judgment:
      'The Corners of the Mouth. Perseverance brings good fortune. Pay heed to the providing of nourishment and to what a person seeks to fill their own mouth with.',
    image:
      'At the foot of the mountain, thunder: The image of Providing Nourishment. Thus the superior person is careful of their words and temperate in eating and drinking.',
  },
  {
    number: 28,
    name: 'Preponderance of the Great',
    chinese: '大過 Dà Guò',
    judgment:
      'Preponderance of the Great. The ridgepole sags to the breaking point. It furthers one to have somewhere to go. Success.',
    image:
      'The lake rises above the trees: Preponderance of the Great. Thus the superior person, when they stand alone, are unconcerned, and if they must renounce the world, they are undaunted.',
  },
  {
    number: 29,
    name: 'The Abysmal (Water)',
    chinese: '坎 Kǎn',
    judgment:
      'The Abysmal repeated. If you are sincere, you have success in your heart, and whatever you do succeeds.',
    image:
      'Water flows on uninterruptedly and reaches its goal: The Abysmal repeated. Thus the superior person walks in lasting virtue and carries on the business of teaching.',
  },
  {
    number: 30,
    name: 'The Clinging (Fire)',
    chinese: '離 Lí',
    judgment:
      'The Clinging. Perseverance furthers. It brings success. Care of the cow brings good fortune.',
    image:
      'That which is bright rises twice: The Clinging. Thus the great person, by perpetuating this brightness, illumines the four quarters of the world.',
  },
  {
    number: 31,
    name: 'Influence (Wooing)',
    chinese: '咸 Xián',
    judgment:
      'Influence. Success. Perseverance furthers. To take a maiden to wife brings good fortune.',
    image:
      'A lake on the mountain: Influence. Thus the superior person encourages people to approach them by their readiness to receive them.',
  },
  {
    number: 32,
    name: 'Duration',
    chinese: '恆 Héng',
    judgment:
      'Duration. Success. No blame. Perseverance furthers. It furthers one to have somewhere to go.',
    image:
      'Thunder and wind: Duration. Thus the superior person stands firm and does not change their direction.',
  },
  {
    number: 33,
    name: 'Retreat',
    chinese: '遯 Dùn',
    judgment: 'Retreat. Success. In what is small, perseverance furthers.',
    image:
      'Mountain under heaven: Retreat. Thus the superior person keeps the inferior at a distance, not angrily but with reserve.',
  },
  {
    number: 34,
    name: 'The Power of the Great',
    chinese: '大壯 Dà Zhuàng',
    judgment: 'The Power of the Great. Perseverance furthers.',
    image:
      'Thunder in heaven above: The Power of the Great. Thus the superior person does not tread upon paths that do not accord with established order.',
  },
  {
    number: 35,
    name: 'Progress',
    chinese: '晉 Jìn',
    judgment:
      'Progress. The powerful prince is honored with horses in large numbers. In a single day he is granted audience three times.',
    image:
      'The sun rises over the earth: Progress. Thus the superior person themselves brightens their bright virtue.',
  },
  {
    number: 36,
    name: 'Darkening of the Light',
    chinese: '明夷 Míng Yí',
    judgment:
      'Darkening of the Light. In adversity it furthers one to be persevering.',
    image:
      'The light has sunk into the earth: Darkening of the Light. Thus does the superior person live with the great mass: they veil their light, yet still shine.',
  },
  {
    number: 37,
    name: 'The Family (The Clan)',
    chinese: '家人 Jiā Rén',
    judgment: 'The Family. The perseverance of the woman furthers.',
    image:
      'Wind comes forth from fire: The Family. Thus the superior person has substance in their words and duration in their way of life.',
  },
  {
    number: 38,
    name: 'Opposition',
    chinese: '睽 Kuí',
    judgment: 'Opposition. In small matters, good fortune.',
    image:
      'Above, fire; below, the lake: Opposition. Thus amid all fellowship the superior person retains their individuality.',
  },
  {
    number: 39,
    name: 'Obstruction',
    chinese: '蹇 Jiǎn',
    judgment:
      'Obstruction. The southwest furthers. The northeast does not further. It furthers one to see the great person. Perseverance brings good fortune.',
    image:
      'Water on the mountain: Obstruction. Thus the superior person turns their attention to themselves and molds their character.',
  },
  {
    number: 40,
    name: 'Deliverance',
    chinese: '解 Xiè',
    judgment:
      'Deliverance. The southwest furthers. If there is no longer anything where one has to go, return brings good fortune. If there is still something where one has to go, hastening brings good fortune.',
    image:
      'Thunder and rain set in: Deliverance. Thus the superior person pardons mistakes and forgives misdeeds.',
  },
  {
    number: 41,
    name: 'Decrease',
    chinese: '損 Sǔn',
    judgment:
      'Decrease combined with sincerity brings about supreme good fortune without blame. One may be persevering in this. It furthers one to undertake something. How is this to be carried out? One may use two small bowls for the sacrifice.',
    image:
      'At the foot of the mountain, the lake: Decrease. Thus the superior person controls their anger and restrains their instincts.',
  },
  {
    number: 42,
    name: 'Increase',
    chinese: '益 Yì',
    judgment:
      'Increase. It furthers one to undertake something. It furthers one to cross the great water.',
    image:
      'Wind and thunder: Increase. Thus the superior person: if they see good, they imitate it; if they have faults, they rid themselves of them.',
  },
  {
    number: 43,
    name: 'Break-through (Resoluteness)',
    chinese: '夬 Guài',
    judgment:
      'Break-through. One must resolutely make the matter known at the court of the king. It must be announced truthfully. Danger. It is necessary to notify one\'s own city. It does not further to resort to arms. It furthers one to undertake something.',
    image:
      'The lake rises up to heaven: Break-through. Thus the superior person dispenses riches downward and refrains from resting on their virtue.',
  },
  {
    number: 44,
    name: 'Coming to Meet',
    chinese: '姤 Gòu',
    judgment:
      'Coming to Meet. The maiden is powerful. One should not marry such a maiden.',
    image:
      'Under heaven, wind: Coming to Meet. Thus does the prince act when disseminating his commands and proclaiming them to the four quarters of heaven.',
  },
  {
    number: 45,
    name: 'Gathering Together (Massing)',
    chinese: '萃 Cuì',
    judgment:
      'Gathering Together. Success. The king approaches his temple. It furthers one to see the great person. This brings success. Perseverance furthers. To bring great offerings creates good fortune. It furthers one to undertake something.',
    image:
      'Over the earth, the lake: Gathering Together. Thus the superior person renews their weapons in order to meet the unforeseen.',
  },
  {
    number: 46,
    name: 'Pushing Upward',
    chinese: '升 Shēng',
    judgment:
      'Pushing Upward has supreme success. One must see the great person. Fear not. Departure toward the south brings good fortune.',
    image:
      'Within the earth, wood grows: Pushing Upward. Thus the superior person of devoted character heaps up small things in order to achieve something high and great.',
  },
  {
    number: 47,
    name: 'Oppression (Exhaustion)',
    chinese: '困 Kùn',
    judgment:
      'Oppression. Success. Perseverance. The great person brings about good fortune. No blame. When one has something to say, it is not believed.',
    image:
      'There is no water in the lake: Oppression. Thus the superior person stakes their life on following their will.',
  },
  {
    number: 48,
    name: 'The Well',
    chinese: '井 Jǐng',
    judgment:
      'The Well. The town may be changed, but the well cannot be changed. It neither decreases nor increases. They come and go and draw from the well. If one gets down almost to the water and the rope does not go all the way, or the jug breaks, it brings misfortune.',
    image:
      'Water over wood: The Well. Thus the superior person encourages the people at their work and exhorts them to help one another.',
  },
  {
    number: 49,
    name: 'Revolution (Molting)',
    chinese: '革 Gé',
    judgment:
      'Revolution. On your own day you are believed. Supreme success, furthering through perseverance. Remorse disappears.',
    image:
      'Fire in the lake: Revolution. Thus the superior person sets the calendar in order and makes the seasons clear.',
  },
  {
    number: 50,
    name: 'The Caldron',
    chinese: '鼎 Dǐng',
    judgment: 'The Caldron. Supreme good fortune. Success.',
    image:
      'Fire over wood: The Caldron. Thus the superior person consolidates their fate by making their position correct.',
  },
  {
    number: 51,
    name: 'The Arousing (Shock, Thunder)',
    chinese: '震 Zhèn',
    judgment:
      'Shock brings success. Shock comes—oh, oh! Laughing words—ha, ha! The shock terrifies for a hundred miles, and they do not let fall the sacrificial spoon and chalice.',
    image:
      'Thunder repeated: The image of Shock. Thus in fear and trembling the superior person sets their life in order and examines themselves.',
  },
  {
    number: 52,
    name: 'Keeping Still (Mountain)',
    chinese: '艮 Gèn',
    judgment:
      'Keeping Still. Keeping their back still so that they no longer feel their body. They go into their courtyard and do not see their people. No blame.',
    image:
      'Mountains standing close together: Keeping Still. Thus the superior person does not permit their thoughts to go beyond their situation.',
  },
  {
    number: 53,
    name: 'Development (Gradual Progress)',
    chinese: '漸 Jiàn',
    judgment:
      'Development. The maiden is given in marriage. Good fortune. Perseverance furthers.',
    image:
      'On the mountain, a tree: Development. Thus the superior person abides in dignity and virtue, in order to improve the mores.',
  },
  {
    number: 54,
    name: 'The Marrying Maiden',
    chinese: '歸妹 Guī Mèi',
    judgment: 'The Marrying Maiden. Undertakings bring misfortune. Nothing that would further.',
    image:
      'Thunder over the lake: The Marrying Maiden. Thus the superior person understands the transitory in the light of the eternity of the end.',
  },
  {
    number: 55,
    name: 'Abundance (Fullness)',
    chinese: '豐 Fēng',
    judgment:
      'Abundance has success. The king attains abundance. Be not sad. Be like the sun at midday.',
    image:
      'Both thunder and lightning come: Abundance. Thus the superior person decides lawsuits and carries out punishments.',
  },
  {
    number: 56,
    name: 'The Wanderer',
    chinese: '旅 Lǚ',
    judgment:
      'The Wanderer. Success through smallness. Perseverance brings good fortune to the wanderer.',
    image:
      'Fire on the mountain: The Wanderer. Thus the superior person is clear-minded and cautious in imposing penalties, and protracts no lawsuits.',
  },
  {
    number: 57,
    name: 'The Gentle (The Penetrating, Wind)',
    chinese: '巽 Xùn',
    judgment:
      'The Gentle. Success through what is small. It furthers one to have somewhere to go. It furthers one to see the great person.',
    image:
      'Winds following one upon the other: The Gentle. Thus the superior person spreads their commands abroad and carries out their undertakings.',
  },
  {
    number: 58,
    name: 'The Joyous (Lake)',
    chinese: '兌 Duì',
    judgment: 'The Joyous. Success. Perseverance is favorable.',
    image:
      'Lakes resting one on the other: The Joyous. Thus the superior person joins with their friends for discussion and practice.',
  },
  {
    number: 59,
    name: 'Dispersion (Dissolution)',
    chinese: '渙 Huàn',
    judgment:
      'Dispersion. Success. The king approaches his temple. It furthers one to cross the great water. Perseverance furthers.',
    image:
      'The wind drives over the water: Dispersion. Thus the kings of old sacrificed to the Lord and built temples.',
  },
  {
    number: 60,
    name: 'Limitation',
    chinese: '節 Jié',
    judgment:
      'Limitation. Success. Galling limitation must not be persevered in.',
    image:
      'Water over lake: Limitation. Thus the superior person creates number and measure, and examines the nature of virtue and correct conduct.',
  },
  {
    number: 61,
    name: 'Inner Truth',
    chinese: '中孚 Zhōng Fú',
    judgment:
      'Inner Truth. Pigs and fishes. Good fortune. It furthers one to cross the great water. Perseverance furthers.',
    image:
      'Wind over lake: Inner Truth. Thus the superior person discusses criminal cases in order to delay executions.',
  },
  {
    number: 62,
    name: 'Preponderance of the Small',
    chinese: '小過 Xiǎo Guò',
    judgment:
      'Preponderance of the Small. Success. Perseverance furthers. Small things may be done; great things should not be done. The flying bird brings the message: It is not well to strive upward, it is well to remain below. Great good fortune.',
    image:
      'Thunder on the mountain: Preponderance of the Small. Thus in their conduct the superior person gives preponderance to reverence. In bereavement they give preponderance to grief. In their expenditures they give preponderance to thrift.',
  },
  {
    number: 63,
    name: 'After Completion',
    chinese: '既濟 Jì Jì',
    judgment:
      'After Completion. Success in small matters. Perseverance furthers. At the beginning good fortune, at the end disorder.',
    image:
      'Water over fire: After Completion. Thus the superior person takes thought of misfortune and arms themselves against it in advance.',
  },
  {
    number: 64,
    name: 'Before Completion',
    chinese: '未濟 Wèi Jì',
    judgment:
      'Before Completion. Success. But if the little fox, after nearly completing the crossing, gets his tail in the water, there is nothing that would further.',
    image:
      'Fire over water: Before Completion. Thus the superior person is careful in the differentiation of things, so that each finds its place.',
  },
];

const BY_NUMBER = new Map(HEXAGRAMS.map((h) => [h.number, h]));

/** Look up a hexagram by King Wen number (1–64). */
export function getHexagram(number: number): HexagramText | undefined {
  return BY_NUMBER.get(number);
}
