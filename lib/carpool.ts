// Carpool list for 10 Oct 2026. Edit here if pickups change.

export interface Rider {
  name: string;
  phone: string;
  count: number; // people travelling in this car from that family
  note?: string;
}

export interface Car {
  driver: string;
  phone: string;
  riders: Rider[];
}

export const CARS: Car[] = [
  { driver: "B. Nikhil Raj", phone: "9885679736", riders: [{ name: "J. Prashanth", phone: "8951345661", count: 4 }] },
  { driver: "K. Nagaraju", phone: "9740060744", riders: [{ name: "J. Sandhya", phone: "9182876909", count: 1 }] },
  { driver: "Durga Prasad", phone: "9482581194", riders: [{ name: "J. Prasanth (Pandu)", phone: "7702163824", count: 1 }] },
  { driver: "Y. Sudhakar", phone: "9740714659", riders: [{ name: "S. Lalitha", phone: "9740714659", count: 1 }] },
  {
    driver: "G. Sunny",
    phone: "8884681394",
    riders: [
      { name: "B. Hemanth Kumar", phone: "8431993969", count: 1 },
      { name: "Mani Kanta", phone: "9160939009", count: 1 },
      { name: "Ravi Noel", phone: "8121109009", count: 1 },
    ],
  },
  {
    driver: "N. Anand Kumar",
    phone: "9986421929",
    riders: [
      { name: "B. Rajashekar", phone: "9945999874", count: 1, note: "1 of 3 · other 2 with Ravi" },
      { name: "Kiran (Father-in-law)", phone: "9985731959", count: 1 },
    ],
  },
  {
    driver: "Ravi",
    phone: "9900105599",
    riders: [{ name: "B. Rajashekar", phone: "9945999874", count: 2, note: "2 of 3 · other 1 with N. Anand" }],
  },
  { driver: "Sandeep", phone: "9620204430", riders: [{ name: "Madan", phone: "9741608693", count: 3 }] },
  { driver: "K. Jagadeesh", phone: "9535822990", riders: [{ name: "G. Appanna", phone: "9036288432", count: 4 }] },
  { driver: "A. Pradeep Kumar", phone: "9008422011", riders: [{ name: "R. Akshay", phone: "6305751355", count: 2 }] },
  { driver: "Shantakumar", phone: "9035722153", riders: [{ name: "Venkat", phone: "9019294828", count: 3 }] },
  { driver: "Prudhvi Dake", phone: "7702724388", riders: [{ name: "T. Tanoj Kumar", phone: "7075638350", count: 1 }] },
  { driver: "G. Nikhil", phone: "9959772299", riders: [{ name: "T. Santosh Kumar", phone: "9550224642", count: 2 }] },
  { driver: "Jesupadam", phone: "8553416362", riders: [{ name: "Andrew", phone: "9591793561", count: 3 }] },
  { driver: "M. Rajesh", phone: "9916418132", riders: [{ name: "Jamima", phone: "8790903663", count: 3 }] },
  { driver: "Bobby", phone: "9916607186", riders: [{ name: "K. Prasad Lal", phone: "7036690214", count: 3 }] },
  { driver: "Srikanth", phone: "9986727567", riders: [{ name: "V. Suresh", phone: "8919620570", count: 1 }] },
  { driver: "G. Samuel Kishore", phone: "9980195735", riders: [{ name: "Sanjanna", phone: "8088487655", count: 4 }] },
  { driver: "K. Sundar", phone: "7801099926", riders: [{ name: "Ramreddy", phone: "7095654614", count: 2 }] },
];

export const seatsIn = (car: Car) => car.riders.reduce((a, r) => a + r.count, 0);
export const formatPhone = (p: string) => (p.length === 10 ? `${p.slice(0, 5)} ${p.slice(5)}` : p);
export const telHref = (p: string) => `tel:+91${p}`;
