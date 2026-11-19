// 36 deterministic mock profiles. `likesMe` is SERVER-ONLY and is never sent to the client.
const names = ['Aanya','Rohan','Meera','Kabir','Ishita','Arjun','Diya','Vihaan','Naina','Aarav','Saanvi','Reyansh',
  'Tara','Advait','Riya','Kian','Anika','Dev','Myra','Yash','Kiara','Samar','Zoya','Neil','Pooja','Rahul',
  'Sneha','Karan','Tanvi','Harsh','Avni','Ishaan','Palak','Veer','Sia','Manav'];
const places = ['Delhi University','IIT Bombay','Bengaluru','Pune','BITS Pilani','Mumbai','Hyderabad','Christ University',
  'Patna','Jaipur','Kolkata','NIT Trichy'];
const bios = [
  'Chai over coffee, always. Will judge you by your playlist.',
  'Weekend trekker, weekday overthinker.',
  'Looking for someone to split fries and opinions with.',
  'Dog person. Terrible at texting back, great at showing up.',
  'Film club president. Ask me about my top 4 Ghibli movies.',
  'Cricket on the TV, biryani on the plate.',
  'Learning guitar badly, loudly and with joy.',
  'Night owl. Best conversations happen after midnight.',
  'Part-time foodie, full-time sleepy.',
  'Here for good banter and better memes.',
];
const interestPool = ['Music','Travel','Cricket','Anime','Cooking','Photography','Gaming','Books','Fitness','Movies',
  'Coding','Dancing','Art','Hiking','Coffee','Stand-up','Football','Poetry'];
const LIKES_ME = new Set([1, 3, 6, 9, 12, 15, 19, 23, 27, 30, 34]);

export const PROFILES = names.map((name, i) => ({
  id: `p${i + 1}`,
  name,
  age: 19 + ((i * 7) % 10),
  photo: `https://picsum.photos/seed/coy-${name.toLowerCase()}/600/800`,
  bio: bios[i % bios.length],
  place: places[(i * 5) % places.length],
  interests: [0, 5, 11].map((k) => interestPool[(i * 3 + k) % interestPool.length]),
  likesMe: LIKES_ME.has(i),
}));
