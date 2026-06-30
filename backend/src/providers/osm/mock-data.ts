import type { LocationSuggestionDTO, PoiDTO } from "../../core/contracts.js";

export const mockLocations: LocationSuggestionDTO[] = [
  { id: "loc-rome", title: "Рим", subtitle: "Италия", center: { lat: 41.9028, lng: 12.4964 } },
  {
    id: "loc-barcelona",
    title: "Барселона",
    subtitle: "Испания",
    center: { lat: 41.3851, lng: 2.1734 },
  },
  { id: "loc-kyoto", title: "Киото", subtitle: "Япония", center: { lat: 35.0116, lng: 135.7681 } },
  { id: "loc-moscow", title: "Москва", subtitle: "Россия", center: { lat: 55.7558, lng: 37.6176 } },
];

export const mockPoisByLocationId: Record<string, PoiDTO[]> = {
  "loc-rome": [
    {
      id: "poi-rome-colosseum",
      title: "Колизей",
      description: "Древний амфитеатр и символ Рима.",
      categories: ["history", "culture", "architecture"],
      location: { lat: 41.8902, lng: 12.4922 },
      photoUrl: "/poi/colosseum.jpg",
    },
    {
      id: "poi-rome-trevi",
      title: "Фонтан Треви",
      description: "Барочный фонтан с традицией бросать монеты.",
      categories: ["culture", "architecture"],
      location: { lat: 41.9009, lng: 12.4833 },
      photoUrl: "/poi/trevi.jpg",
    },
    {
      id: "poi-rome-pantheon",
      title: "Пантеон",
      description: "Хорошо сохранившийся античный храм.",
      categories: ["history", "architecture"],
      location: { lat: 41.8986, lng: 12.4769 },
      photoUrl: "/poi/pantheon.jpg",
    },
    {
      id: "poi-rome-villa-borghese",
      title: "Сады Виллы Боргезе",
      description: "Большой парк для прогулок в центре города.",
      categories: ["nature", "culture"],
      location: { lat: 41.9142, lng: 12.4923 },
      photoUrl: "/poi/villa-borghese.jpg",
    },
    {
      id: "poi-rome-campo",
      title: "Кампо-деи-Фьори",
      description: "Рынок днём и оживлённая площадь вечером.",
      categories: ["food", "culture"],
      location: { lat: 41.8957, lng: 12.4722 },
      photoUrl: "/poi/campo-dei-fiori.jpg",
    },
    {
      id: "poi-rome-vatican",
      title: "Музеи Ватикана",
      description: "Залы с коллекциями искусства и Сикстинской капеллой.",
      categories: ["museum", "culture", "history"],
      location: { lat: 41.9065, lng: 12.4536 },
      photoUrl: "/poi/vatican-museums.jpg",
    },
    {
      id: "poi-rome-navona",
      title: "Пьяцца Навона",
      description: "Историческая площадь с фонтанами и уличными артистами.",
      categories: ["culture", "history"],
      location: { lat: 41.8992, lng: 12.4731 },
      photoUrl: "/poi/rome-navona.jpg",
    },
    {
      id: "poi-rome-spanish-steps",
      title: "Испанская лестница",
      description: "Знаменитая лестница и видовая точка в центре.",
      categories: ["architecture", "culture"],
      location: { lat: 41.9059, lng: 12.4823 },
      photoUrl: "/poi/rome-spanish-steps.jpg",
    },
    {
      id: "poi-rome-castel",
      title: "Замок Святого Ангела",
      description: "Крепость-музей на берегу Тибра.",
      categories: ["history", "museum"],
      location: { lat: 41.9031, lng: 12.4663 },
      photoUrl: "/poi/rome-castel.jpg",
    },
    {
      id: "poi-rome-trastevere",
      title: "Трастевере",
      description: "Атмосферный район с ресторанами и узкими улицами.",
      categories: ["food", "culture"],
      location: { lat: 41.8897, lng: 12.4708 },
      photoUrl: "/poi/rome-trastevere.jpg",
    },
  ],
};

export const mockPois: PoiDTO[] = Object.values(mockPoisByLocationId).flat();
