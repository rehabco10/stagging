import type { DraftContract, DraftFlightBlock, DraftPackage, DraftSeason } from "./season"

/**
 * Demo season ingested from the real 1447 data — two sources joined on the
 * Nusuk package id:
 * - `../../hajj-1447/light-housing-system/new-data-sample/`: the 30 housing
 *   contracts (+ their per-package links), the journey file's flights (blocks
 *   = flights that carried ≥30 pilgrims; seats = pilgrims flown, as a proxy),
 *   and the booked room-type mix per package.
 * - `../ocr/`: the 39 packages and their 31 hotel/date chains
 *   (`packages.csv` + `nusuk-submission-model.csv`), re-paired by hotel-set
 *   and capacity partition (row 1's 450 = packages 01+33, etc.), with ties
 *   between same-set rows resolved by the supply file's per-package windows.
 *
 * Adjustments for the 1448 demo (generator: `scripts/seed-1447/`, which needs
 * the sibling `../../hajj-1447/light-housing-system` repo):
 * - Every date rebased 373 days, so the earliest contract lands on
 *   2027-05-12 and stays keep their real alignment with contract windows.
 * - Room mixes are the booked proportions scaled to each package's capacity;
 *   never-booked standard packages default to all-quad, premium/luxury ones
 *   stay unplanned.
 * - Contract beds sum every supply row per room type — the 1447 worker's own
 *   recompute rule; shared rooms may double-count.
 *   «معاد العالمية» → Voco is CONFIRMED by the supply links (its contract
 *   202610000004611 carries exactly the Voco packages 07–13 and 32);
 *   Aziziyah = shifting.
 */

/**
 * Season setup, carried from 1447: the 7,000 quota WAS 1447's allotment (the
 * 1448 figure arrives with the ministry letter and is edited in الإعدادات),
 * and the window is the envelope of every mapped 1447 contract and stay,
 * rebased 373 days onto the 1448 calendar. Config, not fact — the
 * wizard's date defaults flow from it either way.
 */
export const SEED_SEASON: DraftSeason = {
  "year_hijri": 1448,
  "year_gregorian": 2027,
  "quota_total": 7000,
  "starts_on": "2027-05-12",
  "ends_on": "2027-06-16"
}

export const SEED_CONTRACTS: DraftContract[] = [
  {
    "id": "hc_1447_0",
    "hotelId": "h_maysan",
    "contract_no": "202510000004070",
    "city": "madinah",
    "starts_on": "2027-06-12",
    "ends_on": "2027-06-16",
    "status": "signed",
    "lines": [
      {
        "id": "crl_1447_0_0",
        "room_type": "4",
        "rooms": 156,
        "rate_sar": null
      }
    ]
  },
  {
    "id": "hc_1447_1",
    "hotelId": "h_maysan",
    "contract_no": "202510000004071",
    "city": "madinah",
    "starts_on": "2027-05-23",
    "ends_on": "2027-05-26",
    "status": "signed",
    "lines": [
      {
        "id": "crl_1447_1_0",
        "room_type": "4",
        "rooms": 24,
        "rate_sar": null
      }
    ]
  },
  {
    "id": "hc_1447_2",
    "hotelId": "h_maysan",
    "contract_no": "202510000004073",
    "city": "madinah",
    "starts_on": "2027-05-23",
    "ends_on": "2027-05-27",
    "status": "signed",
    "lines": [
      {
        "id": "crl_1447_2_0",
        "room_type": "4",
        "rooms": 132,
        "rate_sar": null
      }
    ]
  },
  {
    "id": "hc_1447_3",
    "hotelId": "h_maysan",
    "contract_no": "202510000004074",
    "city": "madinah",
    "starts_on": "2027-05-26",
    "ends_on": "2027-05-30",
    "status": "signed",
    "lines": [
      {
        "id": "crl_1447_3_0",
        "room_type": "4",
        "rooms": 24,
        "rate_sar": null
      }
    ]
  },
  {
    "id": "hc_1447_4",
    "hotelId": "h_maysan",
    "contract_no": "202510000004075",
    "city": "madinah",
    "starts_on": "2027-05-27",
    "ends_on": "2027-05-30",
    "status": "signed",
    "lines": [
      {
        "id": "crl_1447_4_0",
        "room_type": "4",
        "rooms": 132,
        "rate_sar": null
      }
    ]
  },
  {
    "id": "hc_1447_5",
    "hotelId": "h_deyar",
    "contract_no": "202510000004155",
    "city": "madinah",
    "starts_on": "2027-06-08",
    "ends_on": "2027-06-16",
    "status": "signed",
    "lines": [
      {
        "id": "crl_1447_5_0",
        "room_type": "4",
        "rooms": 176,
        "rate_sar": null
      }
    ]
  },
  {
    "id": "hc_1447_6",
    "hotelId": "h_durrat",
    "contract_no": "202510000004158",
    "city": "madinah",
    "starts_on": "2027-05-20",
    "ends_on": "2027-05-30",
    "status": "signed",
    "lines": [
      {
        "id": "crl_1447_6_0",
        "room_type": "4",
        "rooms": 264,
        "rate_sar": null
      }
    ]
  },
  {
    "id": "hc_1447_7",
    "hotelId": "h_aziziyah",
    "contract_no": "202510000004169",
    "city": "shifting",
    "starts_on": "2027-05-20",
    "ends_on": "2027-06-14",
    "status": "signed",
    "lines": [
      {
        "id": "crl_1447_7_0",
        "room_type": "4",
        "rooms": 24,
        "rate_sar": null
      }
    ]
  },
  {
    "id": "hc_1447_8",
    "hotelId": "h_aziziyah",
    "contract_no": "202510000004183",
    "city": "shifting",
    "starts_on": "2027-05-20",
    "ends_on": "2027-06-14",
    "status": "signed",
    "lines": [
      {
        "id": "crl_1447_8_0",
        "room_type": "4",
        "rooms": 24,
        "rate_sar": null
      }
    ]
  },
  {
    "id": "hc_1447_9",
    "hotelId": "h_pullman",
    "contract_no": "202510000004200",
    "city": "makkah",
    "starts_on": "2027-06-08",
    "ends_on": "2027-06-12",
    "status": "signed",
    "lines": [
      {
        "id": "crl_1447_9_0",
        "room_type": "4",
        "rooms": 10,
        "rate_sar": null
      },
      {
        "id": "crl_1447_9_1",
        "room_type": "3",
        "rooms": 8,
        "rate_sar": null
      },
      {
        "id": "crl_1447_9_2",
        "room_type": "2",
        "rooms": 18,
        "rate_sar": null
      }
    ]
  },
  {
    "id": "hc_1447_10",
    "hotelId": "h_pullman",
    "contract_no": "202510000004202",
    "city": "makkah",
    "starts_on": "2027-05-24",
    "ends_on": "2027-05-29",
    "status": "signed",
    "lines": [
      {
        "id": "crl_1447_10_0",
        "room_type": "4",
        "rooms": 10,
        "rate_sar": null
      },
      {
        "id": "crl_1447_10_1",
        "room_type": "3",
        "rooms": 8,
        "rate_sar": null
      },
      {
        "id": "crl_1447_10_2",
        "room_type": "2",
        "rooms": 18,
        "rate_sar": null
      }
    ]
  },
  {
    "id": "hc_1447_11",
    "hotelId": "h_maysan",
    "contract_no": "202510000004212",
    "city": "madinah",
    "starts_on": "2027-06-08",
    "ends_on": "2027-06-12",
    "status": "signed",
    "lines": [
      {
        "id": "crl_1447_11_0",
        "room_type": "4",
        "rooms": 156,
        "rate_sar": null
      }
    ]
  },
  {
    "id": "hc_1447_12",
    "hotelId": "h_aziziyah",
    "contract_no": "202610000004389",
    "city": "shifting",
    "starts_on": "2027-05-20",
    "ends_on": "2027-06-14",
    "status": "signed",
    "lines": [
      {
        "id": "crl_1447_12_0",
        "room_type": "4",
        "rooms": 1159,
        "rate_sar": null
      }
    ]
  },
  {
    "id": "hc_1447_13",
    "hotelId": "h_pullman",
    "contract_no": "202610000004390",
    "city": "makkah",
    "starts_on": "2027-05-29",
    "ends_on": "2027-06-08",
    "status": "signed",
    "lines": [
      {
        "id": "crl_1447_13_0",
        "room_type": "4",
        "rooms": 54,
        "rate_sar": null
      },
      {
        "id": "crl_1447_13_1",
        "room_type": "3",
        "rooms": 24,
        "rate_sar": null
      },
      {
        "id": "crl_1447_13_2",
        "room_type": "2",
        "rooms": 44,
        "rate_sar": null
      }
    ]
  },
  {
    "id": "hc_1447_14",
    "hotelId": "h_haram",
    "contract_no": "202610000004437",
    "city": "madinah",
    "starts_on": "2027-05-20",
    "ends_on": "2027-05-24",
    "status": "signed",
    "lines": [
      {
        "id": "crl_1447_14_0",
        "room_type": "4",
        "rooms": 10,
        "rate_sar": null
      },
      {
        "id": "crl_1447_14_1",
        "room_type": "3",
        "rooms": 8,
        "rate_sar": null
      },
      {
        "id": "crl_1447_14_2",
        "room_type": "2",
        "rooms": 18,
        "rate_sar": null
      }
    ]
  },
  {
    "id": "hc_1447_15",
    "hotelId": "h_haram",
    "contract_no": "202610000004438",
    "city": "madinah",
    "starts_on": "2027-05-24",
    "ends_on": "2027-05-29",
    "status": "signed",
    "lines": [
      {
        "id": "crl_1447_15_0",
        "room_type": "4",
        "rooms": 14,
        "rate_sar": null
      },
      {
        "id": "crl_1447_15_1",
        "room_type": "3",
        "rooms": 6,
        "rate_sar": null
      },
      {
        "id": "crl_1447_15_2",
        "room_type": "2",
        "rooms": 8,
        "rate_sar": null
      }
    ]
  },
  {
    "id": "hc_1447_16",
    "hotelId": "h_haram",
    "contract_no": "202610000004439",
    "city": "madinah",
    "starts_on": "2027-05-26",
    "ends_on": "2027-05-29",
    "status": "signed",
    "lines": [
      {
        "id": "crl_1447_16_0",
        "room_type": "4",
        "rooms": 20,
        "rate_sar": null
      },
      {
        "id": "crl_1447_16_1",
        "room_type": "3",
        "rooms": 9,
        "rate_sar": null
      },
      {
        "id": "crl_1447_16_2",
        "room_type": "2",
        "rooms": 18,
        "rate_sar": null
      }
    ]
  },
  {
    "id": "hc_1447_17",
    "hotelId": "h_haram",
    "contract_no": "202610000004440",
    "city": "madinah",
    "starts_on": "2027-05-29",
    "ends_on": "2027-06-01",
    "status": "signed",
    "lines": [
      {
        "id": "crl_1447_17_0",
        "room_type": "4",
        "rooms": 20,
        "rate_sar": null
      },
      {
        "id": "crl_1447_17_1",
        "room_type": "3",
        "rooms": 9,
        "rate_sar": null
      },
      {
        "id": "crl_1447_17_2",
        "room_type": "2",
        "rooms": 18,
        "rate_sar": null
      }
    ]
  },
  {
    "id": "hc_1447_18",
    "hotelId": "h_haram",
    "contract_no": "202610000004441",
    "city": "madinah",
    "starts_on": "2027-06-08",
    "ends_on": "2027-06-12",
    "status": "signed",
    "lines": [
      {
        "id": "crl_1447_18_0",
        "room_type": "4",
        "rooms": 37,
        "rate_sar": null
      },
      {
        "id": "crl_1447_18_1",
        "room_type": "3",
        "rooms": 28,
        "rate_sar": null
      },
      {
        "id": "crl_1447_18_2",
        "room_type": "2",
        "rooms": 64,
        "rate_sar": null
      }
    ]
  },
  {
    "id": "hc_1447_19",
    "hotelId": "h_haram",
    "contract_no": "202610000004442",
    "city": "madinah",
    "starts_on": "2027-06-08",
    "ends_on": "2027-06-11",
    "status": "signed",
    "lines": [
      {
        "id": "crl_1447_19_0",
        "room_type": "4",
        "rooms": 20,
        "rate_sar": null
      },
      {
        "id": "crl_1447_19_1",
        "room_type": "3",
        "rooms": 16,
        "rate_sar": null
      },
      {
        "id": "crl_1447_19_2",
        "room_type": "2",
        "rooms": 36,
        "rate_sar": null
      }
    ]
  },
  {
    "id": "hc_1447_20",
    "hotelId": "h_haram",
    "contract_no": "202610000004443",
    "city": "madinah",
    "starts_on": "2027-06-12",
    "ends_on": "2027-06-15",
    "status": "signed",
    "lines": [
      {
        "id": "crl_1447_20_0",
        "room_type": "4",
        "rooms": 10,
        "rate_sar": null
      },
      {
        "id": "crl_1447_20_1",
        "room_type": "3",
        "rooms": 8,
        "rate_sar": null
      },
      {
        "id": "crl_1447_20_2",
        "room_type": "2",
        "rooms": 18,
        "rate_sar": null
      }
    ]
  },
  {
    "id": "hc_1447_21",
    "hotelId": "h_hilton",
    "contract_no": "202610000004508",
    "city": "madinah",
    "starts_on": "2027-05-15",
    "ends_on": "2027-05-20",
    "status": "signed",
    "lines": [
      {
        "id": "crl_1447_21_0",
        "room_type": "4",
        "rooms": 3,
        "rate_sar": null
      },
      {
        "id": "crl_1447_21_1",
        "room_type": "3",
        "rooms": 4,
        "rate_sar": null
      },
      {
        "id": "crl_1447_21_2",
        "room_type": "2",
        "rooms": 23,
        "rate_sar": null
      }
    ]
  },
  {
    "id": "hc_1447_22",
    "hotelId": "h_hyatt",
    "contract_no": "202610000004527",
    "city": "makkah",
    "starts_on": "2027-05-20",
    "ends_on": "2027-05-29",
    "status": "signed",
    "lines": [
      {
        "id": "crl_1447_22_0",
        "room_type": "4",
        "rooms": 7,
        "rate_sar": null
      },
      {
        "id": "crl_1447_22_1",
        "room_type": "3",
        "rooms": 10,
        "rate_sar": null
      },
      {
        "id": "crl_1447_22_2",
        "room_type": "2",
        "rooms": 66,
        "rate_sar": null
      }
    ]
  },
  {
    "id": "hc_1447_23",
    "hotelId": "h_hyatt",
    "contract_no": "202610000004530",
    "city": "makkah",
    "starts_on": "2027-05-25",
    "ends_on": "2027-05-29",
    "status": "signed",
    "lines": [
      {
        "id": "crl_1447_23_0",
        "room_type": "4",
        "rooms": 12,
        "rate_sar": null
      },
      {
        "id": "crl_1447_23_1",
        "room_type": "3",
        "rooms": 8,
        "rate_sar": null
      },
      {
        "id": "crl_1447_23_2",
        "room_type": "2",
        "rooms": 19,
        "rate_sar": null
      }
    ]
  },
  {
    "id": "hc_1447_24",
    "hotelId": "h_swiss",
    "contract_no": "202610000004583",
    "city": "makkah",
    "starts_on": "2027-05-29",
    "ends_on": "2027-06-08",
    "status": "signed",
    "lines": [
      {
        "id": "crl_1447_24_0",
        "room_type": "4",
        "rooms": 45,
        "rate_sar": null
      },
      {
        "id": "crl_1447_24_1",
        "room_type": "3",
        "rooms": 36,
        "rate_sar": null
      },
      {
        "id": "crl_1447_24_2",
        "room_type": "2",
        "rooms": 81,
        "rate_sar": null
      }
    ]
  },
  {
    "id": "hc_1447_25",
    "hotelId": "h_voco",
    "contract_no": "202610000004611",
    "city": "makkah",
    "starts_on": "2027-05-20",
    "ends_on": "2027-06-14",
    "status": "signed",
    "lines": [
      {
        "id": "crl_1447_25_0",
        "room_type": "4",
        "rooms": 248,
        "rate_sar": null
      },
      {
        "id": "crl_1447_25_1",
        "room_type": "3",
        "rooms": 90,
        "rate_sar": null
      },
      {
        "id": "crl_1447_25_2",
        "room_type": "2",
        "rooms": 116,
        "rate_sar": null
      }
    ]
  },
  {
    "id": "hc_1447_26",
    "hotelId": "h_taqwa",
    "contract_no": "202610000004613",
    "city": "madinah",
    "starts_on": "2027-06-08",
    "ends_on": "2027-06-15",
    "status": "signed",
    "lines": [
      {
        "id": "crl_1447_26_0",
        "room_type": "4",
        "rooms": 88,
        "rate_sar": null
      },
      {
        "id": "crl_1447_26_1",
        "room_type": "3",
        "rooms": 36,
        "rate_sar": null
      },
      {
        "id": "crl_1447_26_2",
        "room_type": "2",
        "rooms": 47,
        "rate_sar": null
      }
    ]
  },
  {
    "id": "hc_1447_27",
    "hotelId": "h_taqwa",
    "contract_no": "202610000004614",
    "city": "madinah",
    "starts_on": "2027-05-26",
    "ends_on": "2027-05-29",
    "status": "signed",
    "lines": [
      {
        "id": "crl_1447_27_0",
        "room_type": "4",
        "rooms": 47,
        "rate_sar": null
      },
      {
        "id": "crl_1447_27_1",
        "room_type": "3",
        "rooms": 18,
        "rate_sar": null
      },
      {
        "id": "crl_1447_27_2",
        "room_type": "2",
        "rooms": 23,
        "rate_sar": null
      }
    ]
  },
  {
    "id": "hc_1447_28",
    "hotelId": "h_taqwa",
    "contract_no": "202610000004615",
    "city": "madinah",
    "starts_on": "2027-05-20",
    "ends_on": "2027-05-26",
    "status": "signed",
    "lines": [
      {
        "id": "crl_1447_28_0",
        "room_type": "4",
        "rooms": 94,
        "rate_sar": null
      },
      {
        "id": "crl_1447_28_1",
        "room_type": "3",
        "rooms": 36,
        "rate_sar": null
      },
      {
        "id": "crl_1447_28_2",
        "room_type": "2",
        "rooms": 46,
        "rate_sar": null
      }
    ]
  },
  {
    "id": "hc_1447_29",
    "hotelId": "h_taqwa",
    "contract_no": "202610000004616",
    "city": "madinah",
    "starts_on": "2027-05-12",
    "ends_on": "2027-05-20",
    "status": "signed",
    "lines": [
      {
        "id": "crl_1447_29_0",
        "room_type": "4",
        "rooms": 4,
        "rate_sar": null
      },
      {
        "id": "crl_1447_29_1",
        "room_type": "3",
        "rooms": 6,
        "rate_sar": null
      },
      {
        "id": "crl_1447_29_2",
        "room_type": "2",
        "rooms": 43,
        "rate_sar": null
      }
    ]
  }
]

export const SEED_FLIGHT_BLOCKS: DraftFlightBlock[] = [
  {
    "id": "fb_1447_0",
    "direction": "return",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV215",
    "flies_on": "2027-06-08",
    "from_city": "Jeddah",
    "to_city": "Amsterdam",
    "contract_type": "group",
    "pnr": "",
    "seats": 261,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_1",
    "direction": "arrival",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV214",
    "flies_on": "2027-05-20",
    "from_city": "Amsterdam",
    "to_city": "Jeddah",
    "contract_type": "group",
    "pnr": "",
    "seats": 198,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_2",
    "direction": "return",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV215",
    "flies_on": "2027-06-12",
    "from_city": "Jeddah",
    "to_city": "Amsterdam",
    "contract_type": "group",
    "pnr": "",
    "seats": 196,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_3",
    "direction": "arrival",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV130",
    "flies_on": "2027-05-29",
    "from_city": "Paris",
    "to_city": "Jeddah",
    "contract_type": "group",
    "pnr": "",
    "seats": 177,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_4",
    "direction": "return",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV1421",
    "flies_on": "2027-06-15",
    "from_city": "Madina",
    "to_city": "Riyadh",
    "contract_type": "group",
    "pnr": "",
    "seats": 155,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_5",
    "direction": "return",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV127",
    "flies_on": "2027-06-08",
    "from_city": "Jeddah",
    "to_city": "Paris",
    "contract_type": "group",
    "pnr": "",
    "seats": 145,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_6",
    "direction": "return",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV119",
    "flies_on": "2027-06-08",
    "from_city": "Jeddah",
    "to_city": "LONDON",
    "contract_type": "group",
    "pnr": "",
    "seats": 143,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_7",
    "direction": "arrival",
    "airline_ar": "إير كايرو",
    "airline_en": "Air Cairo",
    "flight_no": "SM493",
    "flies_on": "2027-05-20",
    "from_city": "Cairo",
    "to_city": "Madina",
    "contract_type": "group",
    "pnr": "",
    "seats": 139,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_8",
    "direction": "return",
    "airline_ar": "إير كايرو",
    "airline_en": "Air Cairo",
    "flight_no": "SM480",
    "flies_on": "2027-06-09",
    "from_city": "Jeddah",
    "to_city": "Cairo",
    "contract_type": "group",
    "pnr": "",
    "seats": 139,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_9",
    "direction": "return",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV123",
    "flies_on": "2027-06-08",
    "from_city": "Jeddah",
    "to_city": "MANCHESTER",
    "contract_type": "group",
    "pnr": "",
    "seats": 133,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_10",
    "direction": "arrival",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV124",
    "flies_on": "2027-05-29",
    "from_city": "MANCHESTER",
    "to_city": "Jeddah",
    "contract_type": "group",
    "pnr": "",
    "seats": 133,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_11",
    "direction": "arrival",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV1420",
    "flies_on": "2027-05-24",
    "from_city": "Jeddah",
    "to_city": "Madina",
    "contract_type": "group",
    "pnr": "",
    "seats": 128,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_12",
    "direction": "arrival",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV1420",
    "flies_on": "2027-05-21",
    "from_city": "Jeddah",
    "to_city": "Madina",
    "contract_type": "group",
    "pnr": "",
    "seats": 121,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_13",
    "direction": "arrival",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV214",
    "flies_on": "2027-05-29",
    "from_city": "Amsterdam",
    "to_city": "Jeddah",
    "contract_type": "group",
    "pnr": "",
    "seats": 119,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_14",
    "direction": "return",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV127",
    "flies_on": "2027-06-12",
    "from_city": "Jeddah",
    "to_city": "Paris",
    "contract_type": "group",
    "pnr": "",
    "seats": 119,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_15",
    "direction": "arrival",
    "airline_ar": "إير كايرو",
    "airline_en": "Air Cairo",
    "flight_no": "SM477",
    "flies_on": "2027-05-23",
    "from_city": "Cairo",
    "to_city": "Jeddah",
    "contract_type": "group",
    "pnr": "",
    "seats": 107,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_16",
    "direction": "return",
    "airline_ar": "إير كايرو",
    "airline_en": "Air Cairo",
    "flight_no": "SM494",
    "flies_on": "2027-06-12",
    "from_city": "Madina",
    "to_city": "Cairo",
    "contract_type": "group",
    "pnr": "",
    "seats": 107,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_17",
    "direction": "arrival",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV1422",
    "flies_on": "2027-05-25",
    "from_city": "Jeddah",
    "to_city": "Madina",
    "contract_type": "group",
    "pnr": "",
    "seats": 106,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_18",
    "direction": "arrival",
    "airline_ar": "الاماراتيه",
    "airline_en": "ALAMARATYH",
    "flight_no": "EK809",
    "flies_on": "2027-05-12",
    "from_city": "Dubai",
    "to_city": "Madina",
    "contract_type": "group",
    "pnr": "",
    "seats": 97,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_19",
    "direction": "return",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV1429",
    "flies_on": "2027-06-16",
    "from_city": "Madina",
    "to_city": "Jeddah",
    "contract_type": "group",
    "pnr": "",
    "seats": 95,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_20",
    "direction": "arrival",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV210",
    "flies_on": "2027-05-24",
    "from_city": "MILANO",
    "to_city": "Jeddah",
    "contract_type": "group",
    "pnr": "",
    "seats": 95,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_21",
    "direction": "return",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV211",
    "flies_on": "2027-06-08",
    "from_city": "Jeddah",
    "to_city": "MILANO",
    "contract_type": "group",
    "pnr": "",
    "seats": 95,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_22",
    "direction": "return",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV215",
    "flies_on": "2027-06-15",
    "from_city": "Jeddah",
    "to_city": "Amsterdam",
    "contract_type": "group",
    "pnr": "",
    "seats": 94,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_23",
    "direction": "arrival",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV214",
    "flies_on": "2027-05-27",
    "from_city": "Amsterdam",
    "to_city": "Jeddah",
    "contract_type": "group",
    "pnr": "",
    "seats": 93,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_24",
    "direction": "arrival",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV126",
    "flies_on": "2027-05-28",
    "from_city": "Paris",
    "to_city": "Jeddah",
    "contract_type": "group",
    "pnr": "",
    "seats": 92,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_25",
    "direction": "arrival",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV1467",
    "flies_on": "2027-05-24",
    "from_city": "Riyadh",
    "to_city": "Madina",
    "contract_type": "group",
    "pnr": "",
    "seats": 92,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_26",
    "direction": "return",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV211",
    "flies_on": "2027-06-12",
    "from_city": "Jeddah",
    "to_city": "MILANO",
    "contract_type": "group",
    "pnr": "",
    "seats": 90,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_27",
    "direction": "return",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV1421",
    "flies_on": "2027-06-12",
    "from_city": "Madina",
    "to_city": "Jeddah",
    "contract_type": "group",
    "pnr": "",
    "seats": 90,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_28",
    "direction": "arrival",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV1465",
    "flies_on": "2027-05-23",
    "from_city": "Riyadh",
    "to_city": "Madina",
    "contract_type": "group",
    "pnr": "",
    "seats": 89,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_29",
    "direction": "return",
    "airline_ar": "السعودية",
    "airline_en": "Saudi Airlines",
    "flight_no": "SV21",
    "flies_on": "2027-06-08",
    "from_city": "Jeddah",
    "to_city": "NEWYORK",
    "contract_type": "group",
    "pnr": "",
    "seats": 89,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_30",
    "direction": "return",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV1014",
    "flies_on": "2027-06-09",
    "from_city": "Jeddah",
    "to_city": "Riyadh",
    "contract_type": "group",
    "pnr": "",
    "seats": 89,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_31",
    "direction": "return",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV1016",
    "flies_on": "2027-06-12",
    "from_city": "Jeddah",
    "to_city": "Riyadh",
    "contract_type": "group",
    "pnr": "",
    "seats": 86,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_32",
    "direction": "arrival",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV1457",
    "flies_on": "2027-05-20",
    "from_city": "Riyadh",
    "to_city": "Madina",
    "contract_type": "group",
    "pnr": "",
    "seats": 85,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_33",
    "direction": "return",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV131",
    "flies_on": "2027-06-08",
    "from_city": "Jeddah",
    "to_city": "Paris",
    "contract_type": "group",
    "pnr": "",
    "seats": 85,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_34",
    "direction": "arrival",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV1051",
    "flies_on": "2027-05-30",
    "from_city": "Riyadh",
    "to_city": "Jeddah",
    "contract_type": "group",
    "pnr": "",
    "seats": 83,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_35",
    "direction": "return",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV127",
    "flies_on": "2027-06-15",
    "from_city": "Jeddah",
    "to_city": "Paris",
    "contract_type": "group",
    "pnr": "",
    "seats": 83,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_36",
    "direction": "arrival",
    "airline_ar": "الخطوط الجوية البريطانية",
    "airline_en": "British Airways",
    "flight_no": "BA133",
    "flies_on": "2027-05-28",
    "from_city": "LONDON",
    "to_city": "Jeddah",
    "contract_type": "group",
    "pnr": "",
    "seats": 82,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_37",
    "direction": "return",
    "airline_ar": "الخطوط الجوية البريطانية",
    "airline_en": "British Airways",
    "flight_no": "BA132",
    "flies_on": "2027-06-11",
    "from_city": "Jeddah",
    "to_city": "LONDON",
    "contract_type": "group",
    "pnr": "",
    "seats": 82,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_38",
    "direction": "return",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV1429",
    "flies_on": "2027-06-15",
    "from_city": "Madina",
    "to_city": "Riyadh",
    "contract_type": "group",
    "pnr": "",
    "seats": 82,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_39",
    "direction": "arrival",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV250",
    "flies_on": "2027-05-29",
    "from_city": "BIRMINGHAM",
    "to_city": "Jeddah",
    "contract_type": "group",
    "pnr": "",
    "seats": 80,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_40",
    "direction": "return",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV253",
    "flies_on": "2027-06-12",
    "from_city": "Jeddah",
    "to_city": "BIRMINGHAM",
    "contract_type": "group",
    "pnr": "",
    "seats": 80,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_41",
    "direction": "arrival",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV214",
    "flies_on": "2027-05-28",
    "from_city": "Amsterdam",
    "to_city": "Jeddah",
    "contract_type": "group",
    "pnr": "",
    "seats": 78,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_42",
    "direction": "arrival",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV1420",
    "flies_on": "2027-05-25",
    "from_city": "Jeddah",
    "to_city": "Madina",
    "contract_type": "group",
    "pnr": "",
    "seats": 77,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_43",
    "direction": "arrival",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV1051",
    "flies_on": "2027-05-29",
    "from_city": "Riyadh",
    "to_city": "Jeddah",
    "contract_type": "group",
    "pnr": "",
    "seats": 76,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_44",
    "direction": "return",
    "airline_ar": "الاماراتيه",
    "airline_en": "ALAMARATYH",
    "flight_no": "EK802",
    "flies_on": "2027-06-12",
    "from_city": "Jeddah",
    "to_city": "Dubai",
    "contract_type": "group",
    "pnr": "",
    "seats": 74,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_45",
    "direction": "return",
    "airline_ar": "الاماراتيه",
    "airline_en": "ALAMARATYH",
    "flight_no": "EK806",
    "flies_on": "2027-06-12",
    "from_city": "Jeddah",
    "to_city": "Dubai",
    "contract_type": "group",
    "pnr": "",
    "seats": 73,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_46",
    "direction": "arrival",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV126",
    "flies_on": "2027-05-29",
    "from_city": "Paris",
    "to_city": "Jeddah",
    "contract_type": "group",
    "pnr": "",
    "seats": 71,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_47",
    "direction": "return",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV1421",
    "flies_on": "2027-06-16",
    "from_city": "Madina",
    "to_city": "Jeddah",
    "contract_type": "group",
    "pnr": "",
    "seats": 71,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_48",
    "direction": "arrival",
    "airline_ar": "الخطوط الجوية البريطانية",
    "airline_en": "British Airways",
    "flight_no": "BA133",
    "flies_on": "2027-05-30",
    "from_city": "LONDON",
    "to_city": "Jeddah",
    "contract_type": "group",
    "pnr": "",
    "seats": 71,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_49",
    "direction": "return",
    "airline_ar": "الخطوط الجوية البريطانية",
    "airline_en": "British Airways",
    "flight_no": "BA132",
    "flies_on": "2027-06-12",
    "from_city": "Jeddah",
    "to_city": "LONDON",
    "contract_type": "group",
    "pnr": "",
    "seats": 71,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_50",
    "direction": "return",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV1046",
    "flies_on": "2027-06-08",
    "from_city": "Jeddah",
    "to_city": "Paris",
    "contract_type": "group",
    "pnr": "",
    "seats": 69,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_51",
    "direction": "return",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV215",
    "flies_on": "2027-06-10",
    "from_city": "Jeddah",
    "to_city": "Amsterdam",
    "contract_type": "group",
    "pnr": "",
    "seats": 67,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_52",
    "direction": "return",
    "airline_ar": "الخطوط الجوية البريطانية",
    "airline_en": "British Airways",
    "flight_no": "BA132",
    "flies_on": "2027-06-09",
    "from_city": "Jeddah",
    "to_city": "LONDON",
    "contract_type": "group",
    "pnr": "",
    "seats": 66,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_53",
    "direction": "arrival",
    "airline_ar": "الخطوط الجوية البريطانية",
    "airline_en": "British Airways",
    "flight_no": "BA133",
    "flies_on": "2027-05-26",
    "from_city": "LONDON",
    "to_city": "Jeddah",
    "contract_type": "group",
    "pnr": "",
    "seats": 65,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_54",
    "direction": "arrival",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV120",
    "flies_on": "2027-05-29",
    "from_city": "LONDON",
    "to_city": "Jeddah",
    "contract_type": "group",
    "pnr": "",
    "seats": 60,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_55",
    "direction": "arrival",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV1457",
    "flies_on": "2027-05-29",
    "from_city": "Riyadh",
    "to_city": "Madina",
    "contract_type": "group",
    "pnr": "",
    "seats": 58,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_56",
    "direction": "arrival",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV1041",
    "flies_on": "2027-05-30",
    "from_city": "Riyadh",
    "to_city": "Jeddah",
    "contract_type": "group",
    "pnr": "",
    "seats": 50,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_57",
    "direction": "return",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV21",
    "flies_on": "2027-06-11",
    "from_city": "Jeddah",
    "to_city": "NEWYORK",
    "contract_type": "group",
    "pnr": "",
    "seats": 50,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_58",
    "direction": "arrival",
    "airline_ar": "الاماراتيه",
    "airline_en": "ALAMARATYH",
    "flight_no": "EK809",
    "flies_on": "2027-05-15",
    "from_city": "Dubai",
    "to_city": "Madina",
    "contract_type": "group",
    "pnr": "",
    "seats": 50,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_59",
    "direction": "arrival",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV1428",
    "flies_on": "2027-05-23",
    "from_city": "Jeddah",
    "to_city": "Madina",
    "contract_type": "group",
    "pnr": "",
    "seats": 49,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_60",
    "direction": "return",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV35",
    "flies_on": "2027-06-08",
    "from_city": "Jeddah",
    "to_city": "WASHINGTON",
    "contract_type": "group",
    "pnr": "",
    "seats": 49,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_61",
    "direction": "arrival",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV124",
    "flies_on": "2027-05-30",
    "from_city": "MANCHESTER",
    "to_city": "Jeddah",
    "contract_type": "group",
    "pnr": "",
    "seats": 49,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_62",
    "direction": "arrival",
    "airline_ar": "الخطوط الجوية التركية",
    "airline_en": "Turkish Airlines",
    "flight_no": "TK 120",
    "flies_on": "2027-05-24",
    "from_city": "Istanbul",
    "to_city": "Jeddah",
    "contract_type": "group",
    "pnr": "",
    "seats": 48,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_63",
    "direction": "return",
    "airline_ar": "الخطوط الجوية التركية",
    "airline_en": "Turkish Airlines",
    "flight_no": "TK115",
    "flies_on": "2027-06-08",
    "from_city": "Jeddah",
    "to_city": "Istanbul",
    "contract_type": "group",
    "pnr": "",
    "seats": 48,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_64",
    "direction": "return",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV1048",
    "flies_on": "2027-06-08",
    "from_city": "Jeddah",
    "to_city": "Riyadh",
    "contract_type": "group",
    "pnr": "",
    "seats": 48,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_65",
    "direction": "arrival",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV20",
    "flies_on": "2027-05-26",
    "from_city": "NEWYORK",
    "to_city": "Jeddah",
    "contract_type": "group",
    "pnr": "",
    "seats": 48,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_66",
    "direction": "arrival",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV1420",
    "flies_on": "2027-05-26",
    "from_city": "Jeddah",
    "to_city": "Madina",
    "contract_type": "group",
    "pnr": "",
    "seats": 48,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_67",
    "direction": "return",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV237",
    "flies_on": "2027-06-08",
    "from_city": "Jeddah",
    "to_city": "Geneva",
    "contract_type": "group",
    "pnr": "",
    "seats": 48,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_68",
    "direction": "arrival",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV210",
    "flies_on": "2027-05-28",
    "from_city": "MILANO",
    "to_city": "Jeddah",
    "contract_type": "group",
    "pnr": "",
    "seats": 48,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_69",
    "direction": "arrival",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV1424",
    "flies_on": "2027-05-21",
    "from_city": "Jeddah",
    "to_city": "Madina",
    "contract_type": "group",
    "pnr": "",
    "seats": 47,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_70",
    "direction": "arrival",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV228",
    "flies_on": "2027-05-27",
    "from_city": "BARCELONA",
    "to_city": "Jeddah",
    "contract_type": "group",
    "pnr": "",
    "seats": 47,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_71",
    "direction": "return",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV229",
    "flies_on": "2027-06-12",
    "from_city": "Jeddah",
    "to_city": "BARCELONA",
    "contract_type": "group",
    "pnr": "",
    "seats": 47,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_72",
    "direction": "arrival",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV124",
    "flies_on": "2027-05-26",
    "from_city": "MANCHESTER",
    "to_city": "Jeddah",
    "contract_type": "group",
    "pnr": "",
    "seats": 47,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_73",
    "direction": "arrival",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV236",
    "flies_on": "2027-05-27",
    "from_city": "Geneva",
    "to_city": "Jeddah",
    "contract_type": "group",
    "pnr": "",
    "seats": 46,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_74",
    "direction": "return",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV237",
    "flies_on": "2027-06-12",
    "from_city": "Jeddah",
    "to_city": "Geneva",
    "contract_type": "group",
    "pnr": "",
    "seats": 46,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_75",
    "direction": "return",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV211",
    "flies_on": "2027-06-10",
    "from_city": "Jeddah",
    "to_city": "MILANO",
    "contract_type": "group",
    "pnr": "",
    "seats": 46,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_76",
    "direction": "arrival",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV120",
    "flies_on": "2027-05-30",
    "from_city": "LONDON",
    "to_city": "Jeddah",
    "contract_type": "group",
    "pnr": "",
    "seats": 46,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_77",
    "direction": "arrival",
    "airline_ar": "الخطوط الجوية التركية",
    "airline_en": "Turkish Airlines",
    "flight_no": "TK126",
    "flies_on": "2027-05-29",
    "from_city": "Istanbul",
    "to_city": "Jeddah",
    "contract_type": "group",
    "pnr": "",
    "seats": 45,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_78",
    "direction": "return",
    "airline_ar": "الخطوط الجوية التركية",
    "airline_en": "Turkish Airlines",
    "flight_no": "TK127",
    "flies_on": "2027-06-12",
    "from_city": "Jeddah",
    "to_city": "Istanbul",
    "contract_type": "group",
    "pnr": "",
    "seats": 45,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_79",
    "direction": "arrival",
    "airline_ar": "الخطوط الجوية القطرية",
    "airline_en": "Qatar Airways",
    "flight_no": "QR1182",
    "flies_on": "2027-05-30",
    "from_city": "Doha",
    "to_city": "Jeddah",
    "contract_type": "group",
    "pnr": "",
    "seats": 45,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_80",
    "direction": "return",
    "airline_ar": "الخطوط الجوية القطرية",
    "airline_en": "Qatar Airways",
    "flight_no": "QR1185",
    "flies_on": "2027-06-16",
    "from_city": "Jeddah",
    "to_city": "Doha",
    "contract_type": "group",
    "pnr": "",
    "seats": 45,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_81",
    "direction": "arrival",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV168",
    "flies_on": "2027-05-29",
    "from_city": "Frankfort",
    "to_city": "Jeddah",
    "contract_type": "group",
    "pnr": "",
    "seats": 43,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_82",
    "direction": "arrival",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV1057",
    "flies_on": "2027-05-29",
    "from_city": "Riyadh",
    "to_city": "Jeddah",
    "contract_type": "group",
    "pnr": "",
    "seats": 43,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_83",
    "direction": "return",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV123",
    "flies_on": "2027-06-11",
    "from_city": "Jeddah",
    "to_city": "MANCHESTER",
    "contract_type": "group",
    "pnr": "",
    "seats": 43,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_84",
    "direction": "arrival",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV210",
    "flies_on": "2027-05-27",
    "from_city": "MILANO",
    "to_city": "Jeddah",
    "contract_type": "group",
    "pnr": "",
    "seats": 42,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_85",
    "direction": "arrival",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV36",
    "flies_on": "2027-05-26",
    "from_city": "WASHINGTON",
    "to_city": "Jeddah",
    "contract_type": "group",
    "pnr": "",
    "seats": 41,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_86",
    "direction": "arrival",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV1420",
    "flies_on": "2027-05-30",
    "from_city": "Jeddah",
    "to_city": "Madina",
    "contract_type": "group",
    "pnr": "",
    "seats": 39,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_87",
    "direction": "arrival",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV62",
    "flies_on": "2027-05-26",
    "from_city": "TORONTO-PEARSON",
    "to_city": "Jeddah",
    "contract_type": "group",
    "pnr": "",
    "seats": 39,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_88",
    "direction": "return",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV61",
    "flies_on": "2027-06-08",
    "from_city": "Jeddah",
    "to_city": "TORONTO-PEARSON",
    "contract_type": "group",
    "pnr": "",
    "seats": 39,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_89",
    "direction": "arrival",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV120",
    "flies_on": "2027-05-26",
    "from_city": "London",
    "to_city": "Jeddah",
    "contract_type": "group",
    "pnr": "",
    "seats": 38,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_90",
    "direction": "return",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV119",
    "flies_on": "2027-06-12",
    "from_city": "Jeddah",
    "to_city": "LONDON",
    "contract_type": "group",
    "pnr": "",
    "seats": 32,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_91",
    "direction": "arrival",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV226",
    "flies_on": "2027-05-27",
    "from_city": "Madrid",
    "to_city": "Jeddah",
    "contract_type": "group",
    "pnr": "",
    "seats": 29,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_92",
    "direction": "return",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV227",
    "flies_on": "2027-06-12",
    "from_city": "Jeddah",
    "to_city": "Madrid",
    "contract_type": "group",
    "pnr": "",
    "seats": 29,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_93",
    "direction": "return",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV119",
    "flies_on": "2027-06-11",
    "from_city": "Jeddah",
    "to_city": "LONDON",
    "contract_type": "group",
    "pnr": "",
    "seats": 28,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_94",
    "direction": "return",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV167",
    "flies_on": "2027-06-10",
    "from_city": "Jeddah",
    "to_city": "Frankfort",
    "contract_type": "group",
    "pnr": "",
    "seats": 28,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_95",
    "direction": "arrival",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV130",
    "flies_on": "2027-05-27",
    "from_city": "Paris",
    "to_city": "Jeddah",
    "contract_type": "group",
    "pnr": "",
    "seats": 27,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_96",
    "direction": "arrival",
    "airline_ar": "الخطوط الجوية البريطانية",
    "airline_en": "British Airways",
    "flight_no": "BA133",
    "flies_on": "2027-05-27",
    "from_city": "LONDON",
    "to_city": "Jeddah",
    "contract_type": "group",
    "pnr": "",
    "seats": 22,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_97",
    "direction": "arrival",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV226",
    "flies_on": "2027-05-24",
    "from_city": "Madrid",
    "to_city": "Jeddah",
    "contract_type": "group",
    "pnr": "",
    "seats": 21,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_98",
    "direction": "return",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV227",
    "flies_on": "2027-06-08",
    "from_city": "Jeddah",
    "to_city": "Madrid",
    "contract_type": "group",
    "pnr": "",
    "seats": 21,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_99",
    "direction": "return",
    "airline_ar": "الخطوط الجوية البريطانية",
    "airline_en": "British Airways",
    "flight_no": "BA132",
    "flies_on": "2027-06-10",
    "from_city": "Jeddah",
    "to_city": "LONDON",
    "contract_type": "group",
    "pnr": "",
    "seats": 21,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_100",
    "direction": "return",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV1464",
    "flies_on": "2027-06-16",
    "from_city": "Madina",
    "to_city": "Riyadh",
    "contract_type": "group",
    "pnr": "",
    "seats": 20,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_101",
    "direction": "arrival",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV36",
    "flies_on": "2027-05-30",
    "from_city": "WASHINGTON",
    "to_city": "Jeddah",
    "contract_type": "group",
    "pnr": "",
    "seats": 15,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_102",
    "direction": "return",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV1016",
    "flies_on": "2027-06-11",
    "from_city": "Jeddah",
    "to_city": "Riyadh",
    "contract_type": "group",
    "pnr": "",
    "seats": 15,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_103",
    "direction": "arrival",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV168",
    "flies_on": "2027-05-27",
    "from_city": "Frankfort",
    "to_city": "Jeddah",
    "contract_type": "group",
    "pnr": "",
    "seats": 15,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_104",
    "direction": "return",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV167",
    "flies_on": "2027-06-12",
    "from_city": "Jeddah",
    "to_city": "Frankfort",
    "contract_type": "group",
    "pnr": "",
    "seats": 15,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_105",
    "direction": "arrival",
    "airline_ar": "الخطوط الجوية التركية",
    "airline_en": "Turkish Airlines",
    "flight_no": "TK98",
    "flies_on": "2027-05-25",
    "from_city": "Istanbul",
    "to_city": "Madina",
    "contract_type": "group",
    "pnr": "",
    "seats": 14,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_106",
    "direction": "return",
    "airline_ar": "الخطوط الجوية التركية",
    "airline_en": "Turkish Airlines",
    "flight_no": "TK97",
    "flies_on": "2027-06-08",
    "from_city": "Jeddah",
    "to_city": "Istanbul",
    "contract_type": "group",
    "pnr": "",
    "seats": 14,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_107",
    "direction": "arrival",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV62",
    "flies_on": "2027-05-30",
    "from_city": "TORONTO-PEARSON",
    "to_city": "Jeddah",
    "contract_type": "group",
    "pnr": "",
    "seats": 14,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_108",
    "direction": "return",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV61",
    "flies_on": "2027-06-12",
    "from_city": "Jeddah",
    "to_city": "TORONTO-PEARSON",
    "contract_type": "group",
    "pnr": "",
    "seats": 14,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_109",
    "direction": "return",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV1044",
    "flies_on": "2027-06-08",
    "from_city": "Jeddah",
    "to_city": "Riyadh",
    "contract_type": "group",
    "pnr": "",
    "seats": 11,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_110",
    "direction": "arrival",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV1467",
    "flies_on": "2027-05-25",
    "from_city": "Riyadh",
    "to_city": "Madina",
    "contract_type": "group",
    "pnr": "",
    "seats": 10,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_111",
    "direction": "return",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV1050",
    "flies_on": "2027-06-08",
    "from_city": "Jeddah",
    "to_city": "Riyadh",
    "contract_type": "group",
    "pnr": "",
    "seats": 10,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_112",
    "direction": "arrival",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV1420",
    "flies_on": "2027-05-28",
    "from_city": "Jeddah",
    "to_city": "Madina",
    "contract_type": "group",
    "pnr": "",
    "seats": 9,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_113",
    "direction": "return",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV131",
    "flies_on": "2027-06-12",
    "from_city": "Jeddah",
    "to_city": "Paris",
    "contract_type": "group",
    "pnr": "",
    "seats": 9,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_114",
    "direction": "arrival",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV1051",
    "flies_on": "2027-05-23",
    "from_city": "Riyadh",
    "to_city": "Jeddah",
    "contract_type": "group",
    "pnr": "",
    "seats": 6,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_115",
    "direction": "return",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV1464",
    "flies_on": "2027-06-12",
    "from_city": "Madina",
    "to_city": "Riyadh",
    "contract_type": "group",
    "pnr": "",
    "seats": 6,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_116",
    "direction": "arrival",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV1053",
    "flies_on": "2027-05-30",
    "from_city": "Riyadh",
    "to_city": "Jeddah",
    "contract_type": "group",
    "pnr": "",
    "seats": 4,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_117",
    "direction": "arrival",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV250",
    "flies_on": "2027-05-27",
    "from_city": "BIRMINGHAM",
    "to_city": "Jeddah",
    "contract_type": "group",
    "pnr": "",
    "seats": 4,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_118",
    "direction": "return",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV253",
    "flies_on": "2027-06-08",
    "from_city": "Jeddah",
    "to_city": "BIRMINGHAM",
    "contract_type": "group",
    "pnr": "",
    "seats": 4,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_119",
    "direction": "arrival",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV1057",
    "flies_on": "2027-05-27",
    "from_city": "Riyadh",
    "to_city": "Jeddah",
    "contract_type": "group",
    "pnr": "",
    "seats": 2,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_120",
    "direction": "return",
    "airline_ar": "السعودية",
    "airline_en": "Saudia",
    "flight_no": "SV1014",
    "flies_on": "2027-06-11",
    "from_city": "Jeddah",
    "to_city": "Riyadh",
    "contract_type": "group",
    "pnr": "",
    "seats": 2,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_gds_arrival_0",
    "direction": "arrival",
    "airline_ar": "إير كايرو",
    "airline_en": "Air Cairo (GDS)",
    "flight_no": "",
    "flies_on": "2027-05-21",
    "from_city": "متعدد",
    "to_city": "متعدد",
    "contract_type": "gds",
    "pnr": "",
    "seats": 347,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_gds_arrival_1",
    "direction": "arrival",
    "airline_ar": "فلاي دبي",
    "airline_en": "Flydubai (GDS)",
    "flight_no": "",
    "flies_on": "2027-05-20",
    "from_city": "متعدد",
    "to_city": "متعدد",
    "contract_type": "gds",
    "pnr": "",
    "seats": 105,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_gds_arrival_2",
    "direction": "arrival",
    "airline_ar": "السعودية",
    "airline_en": "Saudia (GDS)",
    "flight_no": "",
    "flies_on": "2027-05-12",
    "from_city": "متعدد",
    "to_city": "متعدد",
    "contract_type": "gds",
    "pnr": "",
    "seats": 931,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_gds_arrival_3",
    "direction": "arrival",
    "airline_ar": "طيران أديل",
    "airline_en": "Flyadeal (GDS)",
    "flight_no": "",
    "flies_on": "2027-05-23",
    "from_city": "متعدد",
    "to_city": "متعدد",
    "contract_type": "gds",
    "pnr": "",
    "seats": 250,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_gds_arrival_4",
    "direction": "arrival",
    "airline_ar": "طيران الاتحاد",
    "airline_en": "Etihad Airways (GDS)",
    "flight_no": "",
    "flies_on": "2027-05-12",
    "from_city": "متعدد",
    "to_city": "متعدد",
    "contract_type": "gds",
    "pnr": "",
    "seats": 121,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_gds_arrival_5",
    "direction": "arrival",
    "airline_ar": "الخطوط الجوية القطرية",
    "airline_en": "Qatar Airways (GDS)",
    "flight_no": "",
    "flies_on": "2027-05-12",
    "from_city": "متعدد",
    "to_city": "متعدد",
    "contract_type": "gds",
    "pnr": "",
    "seats": 224,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_gds_arrival_6",
    "direction": "arrival",
    "airline_ar": "الخطوط الجوية التركية",
    "airline_en": "Turkish Airlines (GDS)",
    "flight_no": "",
    "flies_on": "2027-05-12",
    "from_city": "متعدد",
    "to_city": "متعدد",
    "contract_type": "gds",
    "pnr": "",
    "seats": 167,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_gds_arrival_7",
    "direction": "arrival",
    "airline_ar": "طيران الملكية الأردنية",
    "airline_en": "Royal Jordanian (GDS)",
    "flight_no": "",
    "flies_on": "2027-05-20",
    "from_city": "متعدد",
    "to_city": "متعدد",
    "contract_type": "gds",
    "pnr": "",
    "seats": 205,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_gds_arrival_8",
    "direction": "arrival",
    "airline_ar": "طيران ناس",
    "airline_en": "flynas (GDS)",
    "flight_no": "",
    "flies_on": "2027-05-20",
    "from_city": "متعدد",
    "to_city": "متعدد",
    "contract_type": "gds",
    "pnr": "",
    "seats": 263,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_gds_arrival_9",
    "direction": "arrival",
    "airline_ar": "طيران ايجين",
    "airline_en": "Aegean Airlines (GDS)",
    "flight_no": "",
    "flies_on": "2027-05-25",
    "from_city": "متعدد",
    "to_city": "متعدد",
    "contract_type": "gds",
    "pnr": "",
    "seats": 43,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_gds_arrival_10",
    "direction": "arrival",
    "airline_ar": "VF",
    "airline_en": "VF (GDS)",
    "flight_no": "",
    "flies_on": "2027-05-21",
    "from_city": "متعدد",
    "to_city": "متعدد",
    "contract_type": "gds",
    "pnr": "",
    "seats": 52,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_gds_arrival_11",
    "direction": "arrival",
    "airline_ar": "طيران الإمارات",
    "airline_en": "Emirates (GDS)",
    "flight_no": "",
    "flies_on": "2027-05-23",
    "from_city": "متعدد",
    "to_city": "متعدد",
    "contract_type": "gds",
    "pnr": "",
    "seats": 34,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_gds_arrival_12",
    "direction": "arrival",
    "airline_ar": "الخطوط الجوية الأثيوبية",
    "airline_en": "Ethiopian Airlines (GDS)",
    "flight_no": "",
    "flies_on": "2027-05-24",
    "from_city": "متعدد",
    "to_city": "متعدد",
    "contract_type": "gds",
    "pnr": "",
    "seats": 23,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_gds_arrival_13",
    "direction": "arrival",
    "airline_ar": "نسما للطيران",
    "airline_en": "Nesma Airlines (GDS)",
    "flight_no": "",
    "flies_on": "2027-05-24",
    "from_city": "متعدد",
    "to_city": "متعدد",
    "contract_type": "gds",
    "pnr": "",
    "seats": 24,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_gds_arrival_14",
    "direction": "arrival",
    "airline_ar": "طيران بيجاسوس",
    "airline_en": "Pegasus Airlines (GDS)",
    "flight_no": "",
    "flies_on": "2027-05-24",
    "from_city": "متعدد",
    "to_city": "متعدد",
    "contract_type": "gds",
    "pnr": "",
    "seats": 28,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_gds_arrival_15",
    "direction": "arrival",
    "airline_ar": "MSC",
    "airline_en": "MSC (GDS)",
    "flight_no": "",
    "flies_on": "2027-05-27",
    "from_city": "متعدد",
    "to_city": "متعدد",
    "contract_type": "gds",
    "pnr": "",
    "seats": 4,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_gds_arrival_16",
    "direction": "arrival",
    "airline_ar": "طيران الخليج",
    "airline_en": "Gulf Air (GDS)",
    "flight_no": "",
    "flies_on": "2027-05-21",
    "from_city": "متعدد",
    "to_city": "متعدد",
    "contract_type": "gds",
    "pnr": "",
    "seats": 15,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_gds_arrival_17",
    "direction": "arrival",
    "airline_ar": "الخطوط الجوية الفرنسية",
    "airline_en": "Air France (GDS)",
    "flight_no": "",
    "flies_on": "2027-05-30",
    "from_city": "متعدد",
    "to_city": "متعدد",
    "contract_type": "gds",
    "pnr": "",
    "seats": 2,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_gds_arrival_18",
    "direction": "arrival",
    "airline_ar": "طيران الشرق الأوسط",
    "airline_en": "Middle East Airlines (GDS)",
    "flight_no": "",
    "flies_on": "2027-05-20",
    "from_city": "متعدد",
    "to_city": "متعدد",
    "contract_type": "gds",
    "pnr": "",
    "seats": 2,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_gds_arrival_19",
    "direction": "arrival",
    "airline_ar": "الطيران العماني",
    "airline_en": "Oman Air (GDS)",
    "flight_no": "",
    "flies_on": "2027-05-25",
    "from_city": "متعدد",
    "to_city": "متعدد",
    "contract_type": "gds",
    "pnr": "",
    "seats": 2,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_gds_arrival_20",
    "direction": "arrival",
    "airline_ar": "طيران الهند",
    "airline_en": "Air India (GDS)",
    "flight_no": "",
    "flies_on": "2027-05-23",
    "from_city": "متعدد",
    "to_city": "متعدد",
    "contract_type": "gds",
    "pnr": "",
    "seats": 4,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_gds_arrival_21",
    "direction": "arrival",
    "airline_ar": "صاف اير",
    "airline_en": "Safair (GDS)",
    "flight_no": "",
    "flies_on": "2027-05-27",
    "from_city": "متعدد",
    "to_city": "متعدد",
    "contract_type": "gds",
    "pnr": "",
    "seats": 2,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_gds_arrival_22",
    "direction": "arrival",
    "airline_ar": "طيران ايبريا",
    "airline_en": "Iberia (GDS)",
    "flight_no": "",
    "flies_on": "2027-05-25",
    "from_city": "متعدد",
    "to_city": "متعدد",
    "contract_type": "gds",
    "pnr": "",
    "seats": 2,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_gds_arrival_23",
    "direction": "arrival",
    "airline_ar": "الخطوط الجوية الكينية",
    "airline_en": "Kenya Airways (GDS)",
    "flight_no": "",
    "flies_on": "2027-05-23",
    "from_city": "متعدد",
    "to_city": "متعدد",
    "contract_type": "gds",
    "pnr": "",
    "seats": 1,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_gds_arrival_24",
    "direction": "arrival",
    "airline_ar": "طيران تاي إنترناشونال",
    "airline_en": "Thai Airways International (GDS)",
    "flight_no": "",
    "flies_on": "2027-05-28",
    "from_city": "متعدد",
    "to_city": "متعدد",
    "contract_type": "gds",
    "pnr": "",
    "seats": 1,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_gds_arrival_25",
    "direction": "arrival",
    "airline_ar": "العربية للطيران",
    "airline_en": "Air Arabia (GDS)",
    "flight_no": "",
    "flies_on": "2027-05-26",
    "from_city": "متعدد",
    "to_city": "متعدد",
    "contract_type": "gds",
    "pnr": "",
    "seats": 2,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_gds_return_0",
    "direction": "return",
    "airline_ar": "إير كايرو",
    "airline_en": "Air Cairo (GDS)",
    "flight_no": "",
    "flies_on": "2027-06-08",
    "from_city": "متعدد",
    "to_city": "متعدد",
    "contract_type": "gds",
    "pnr": "",
    "seats": 350,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_gds_return_1",
    "direction": "return",
    "airline_ar": "السعودية",
    "airline_en": "Saudia (GDS)",
    "flight_no": "",
    "flies_on": "2027-06-07",
    "from_city": "متعدد",
    "to_city": "متعدد",
    "contract_type": "gds",
    "pnr": "",
    "seats": 1032,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_gds_return_2",
    "direction": "return",
    "airline_ar": "طيران ايجين",
    "airline_en": "Aegean Airlines (GDS)",
    "flight_no": "",
    "flies_on": "2027-06-08",
    "from_city": "متعدد",
    "to_city": "متعدد",
    "contract_type": "gds",
    "pnr": "",
    "seats": 44,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_gds_return_3",
    "direction": "return",
    "airline_ar": "طيران الملكية الأردنية",
    "airline_en": "Royal Jordanian (GDS)",
    "flight_no": "",
    "flies_on": "2027-06-08",
    "from_city": "متعدد",
    "to_city": "متعدد",
    "contract_type": "gds",
    "pnr": "",
    "seats": 207,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_gds_return_4",
    "direction": "return",
    "airline_ar": "طيران أديل",
    "airline_en": "Flyadeal (GDS)",
    "flight_no": "",
    "flies_on": "2027-06-08",
    "from_city": "متعدد",
    "to_city": "متعدد",
    "contract_type": "gds",
    "pnr": "",
    "seats": 222,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_gds_return_5",
    "direction": "return",
    "airline_ar": "طيران ناس",
    "airline_en": "flynas (GDS)",
    "flight_no": "",
    "flies_on": "2027-06-08",
    "from_city": "متعدد",
    "to_city": "متعدد",
    "contract_type": "gds",
    "pnr": "",
    "seats": 268,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_gds_return_6",
    "direction": "return",
    "airline_ar": "الخطوط الجوية التركية",
    "airline_en": "Turkish Airlines (GDS)",
    "flight_no": "",
    "flies_on": "2027-06-08",
    "from_city": "متعدد",
    "to_city": "متعدد",
    "contract_type": "gds",
    "pnr": "",
    "seats": 172,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_gds_return_7",
    "direction": "return",
    "airline_ar": "الخطوط الجوية القطرية",
    "airline_en": "Qatar Airways (GDS)",
    "flight_no": "",
    "flies_on": "2027-06-08",
    "from_city": "متعدد",
    "to_city": "متعدد",
    "contract_type": "gds",
    "pnr": "",
    "seats": 217,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_gds_return_8",
    "direction": "return",
    "airline_ar": "طيران الاتحاد",
    "airline_en": "Etihad Airways (GDS)",
    "flight_no": "",
    "flies_on": "2027-06-08",
    "from_city": "متعدد",
    "to_city": "متعدد",
    "contract_type": "gds",
    "pnr": "",
    "seats": 110,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_gds_return_9",
    "direction": "return",
    "airline_ar": "فلاي دبي",
    "airline_en": "Flydubai (GDS)",
    "flight_no": "",
    "flies_on": "2027-06-08",
    "from_city": "متعدد",
    "to_city": "متعدد",
    "contract_type": "gds",
    "pnr": "",
    "seats": 46,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_gds_return_10",
    "direction": "return",
    "airline_ar": "VF",
    "airline_en": "VF (GDS)",
    "flight_no": "",
    "flies_on": "2027-06-08",
    "from_city": "متعدد",
    "to_city": "متعدد",
    "contract_type": "gds",
    "pnr": "",
    "seats": 40,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_gds_return_11",
    "direction": "return",
    "airline_ar": "الخطوط الجوية الأثيوبية",
    "airline_en": "Ethiopian Airlines (GDS)",
    "flight_no": "",
    "flies_on": "2027-06-08",
    "from_city": "متعدد",
    "to_city": "متعدد",
    "contract_type": "gds",
    "pnr": "",
    "seats": 21,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_gds_return_12",
    "direction": "return",
    "airline_ar": "نسما للطيران",
    "airline_en": "Nesma Airlines (GDS)",
    "flight_no": "",
    "flies_on": "2027-06-08",
    "from_city": "متعدد",
    "to_city": "متعدد",
    "contract_type": "gds",
    "pnr": "",
    "seats": 24,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_gds_return_13",
    "direction": "return",
    "airline_ar": "طيران الإمارات",
    "airline_en": "Emirates (GDS)",
    "flight_no": "",
    "flies_on": "2027-06-08",
    "from_city": "متعدد",
    "to_city": "متعدد",
    "contract_type": "gds",
    "pnr": "",
    "seats": 35,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_gds_return_14",
    "direction": "return",
    "airline_ar": "طيران بيجاسوس",
    "airline_en": "Pegasus Airlines (GDS)",
    "flight_no": "",
    "flies_on": "2027-06-08",
    "from_city": "متعدد",
    "to_city": "متعدد",
    "contract_type": "gds",
    "pnr": "",
    "seats": 26,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_gds_return_15",
    "direction": "return",
    "airline_ar": "طيران الخليج",
    "airline_en": "Gulf Air (GDS)",
    "flight_no": "",
    "flies_on": "2027-06-08",
    "from_city": "متعدد",
    "to_city": "متعدد",
    "contract_type": "gds",
    "pnr": "",
    "seats": 17,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_gds_return_16",
    "direction": "return",
    "airline_ar": "AJY",
    "airline_en": "AJY (GDS)",
    "flight_no": "",
    "flies_on": "2027-06-10",
    "from_city": "متعدد",
    "to_city": "متعدد",
    "contract_type": "gds",
    "pnr": "",
    "seats": 5,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_gds_return_17",
    "direction": "return",
    "airline_ar": "طيران ايبريا",
    "airline_en": "Iberia (GDS)",
    "flight_no": "",
    "flies_on": "2027-06-10",
    "from_city": "متعدد",
    "to_city": "متعدد",
    "contract_type": "gds",
    "pnr": "",
    "seats": 5,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_gds_return_18",
    "direction": "return",
    "airline_ar": "الطيران العماني",
    "airline_en": "Oman Air (GDS)",
    "flight_no": "",
    "flies_on": "2027-06-08",
    "from_city": "متعدد",
    "to_city": "متعدد",
    "contract_type": "gds",
    "pnr": "",
    "seats": 4,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_gds_return_19",
    "direction": "return",
    "airline_ar": "طيران الهند",
    "airline_en": "Air India (GDS)",
    "flight_no": "",
    "flies_on": "2027-06-12",
    "from_city": "متعدد",
    "to_city": "متعدد",
    "contract_type": "gds",
    "pnr": "",
    "seats": 4,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_gds_return_20",
    "direction": "return",
    "airline_ar": "الخطوط الجوية الفرنسية",
    "airline_en": "Air France (GDS)",
    "flight_no": "",
    "flies_on": "2027-06-09",
    "from_city": "متعدد",
    "to_city": "متعدد",
    "contract_type": "gds",
    "pnr": "",
    "seats": 1,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_gds_return_21",
    "direction": "return",
    "airline_ar": "الخطوط الجوية الكينية",
    "airline_en": "Kenya Airways (GDS)",
    "flight_no": "",
    "flies_on": "2027-06-08",
    "from_city": "متعدد",
    "to_city": "متعدد",
    "contract_type": "gds",
    "pnr": "",
    "seats": 1,
    "status": "confirmed"
  },
  {
    "id": "fb_1447_gds_return_22",
    "direction": "return",
    "airline_ar": "العربية للطيران",
    "airline_en": "Air Arabia (GDS)",
    "flight_no": "",
    "flies_on": "2027-06-09",
    "from_city": "متعدد",
    "to_city": "متعدد",
    "contract_type": "gds",
    "pnr": "",
    "seats": 2,
    "status": "confirmed"
  }
]

export const SEED_PACKAGES: DraftPackage[] = [
  {
    "id": "pkg_1447_01",
    "package_no": "01",
    "name_en": "ITHRAA ALKHAIR 01",
    "tier": "luxury",
    "variant_suffix": "",
    "capacity": 200,
    "initial_price_sar": 42426.82,
    "legs": [
      {
        "id": "leg_1447_01_0",
        "role": "first",
        "hotelId": "h_swiss",
        "starts_on": "2027-05-29",
        "ends_on": "2027-06-08"
      },
      {
        "id": "leg_1447_01_1",
        "role": "second",
        "hotelId": "h_haram",
        "starts_on": "2027-06-08",
        "ends_on": "2027-06-12"
      }
    ],
    "contractIds": [
      "hc_1447_19",
      "hc_1447_24"
    ],
    "flightAllocations": [
      {
        "blockId": "fb_1447_56",
        "seats": 50
      },
      {
        "blockId": "fb_1447_57",
        "seats": 50
      },
      {
        "blockId": "fb_1447_gds_arrival_2",
        "seats": 25
      },
      {
        "blockId": "fb_1447_gds_return_1",
        "seats": 25
      },
      {
        "blockId": "fb_1447_gds_arrival_4",
        "seats": 4
      },
      {
        "blockId": "fb_1447_gds_return_8",
        "seats": 4
      },
      {
        "blockId": "fb_1447_gds_arrival_3",
        "seats": 7
      },
      {
        "blockId": "fb_1447_gds_return_4",
        "seats": 7
      },
      {
        "blockId": "fb_1447_54",
        "seats": 28
      },
      {
        "blockId": "fb_1447_93",
        "seats": 28
      },
      {
        "blockId": "fb_1447_gds_arrival_11",
        "seats": 3
      },
      {
        "blockId": "fb_1447_gds_return_13",
        "seats": 5
      },
      {
        "blockId": "fb_1447_10",
        "seats": 43
      },
      {
        "blockId": "fb_1447_83",
        "seats": 43
      },
      {
        "blockId": "fb_1447_gds_arrival_0",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_return_0",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_arrival_12",
        "seats": 4
      },
      {
        "blockId": "fb_1447_gds_return_11",
        "seats": 4
      },
      {
        "blockId": "fb_1447_gds_arrival_1",
        "seats": 3
      },
      {
        "blockId": "fb_1447_gds_arrival_24",
        "seats": 1
      },
      {
        "blockId": "fb_1447_gds_arrival_13",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_return_12",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_arrival_7",
        "seats": 6
      },
      {
        "blockId": "fb_1447_gds_return_3",
        "seats": 6
      },
      {
        "blockId": "fb_1447_gds_arrival_8",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_return_5",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_arrival_6",
        "seats": 4
      },
      {
        "blockId": "fb_1447_gds_return_6",
        "seats": 4
      },
      {
        "blockId": "fb_1447_gds_return_9",
        "seats": 1
      }
    ],
    "room_mix": {
      "2": 67,
      "3": 51,
      "4": 82
    },
    "publish_status": "approved",
    "sale_status": "unavailable",
    "content_ready_ar": true,
    "content_ready_en": true,
    "hero_approved": true
  },
  {
    "id": "pkg_1447_02",
    "package_no": "02",
    "name_en": "ITHRAA ALKHAIR 02",
    "tier": "luxury",
    "variant_suffix": "",
    "capacity": 90,
    "initial_price_sar": 44568.86,
    "legs": [
      {
        "id": "leg_1447_02_0",
        "role": "first",
        "hotelId": "h_haram",
        "starts_on": "2027-05-24",
        "ends_on": "2027-05-29"
      },
      {
        "id": "leg_1447_02_1",
        "role": "second",
        "hotelId": "h_pullman",
        "starts_on": "2027-05-29",
        "ends_on": "2027-06-08"
      }
    ],
    "contractIds": [
      "hc_1447_13",
      "hc_1447_15"
    ],
    "flightAllocations": [
      {
        "blockId": "fb_1447_gds_arrival_0",
        "seats": 8
      },
      {
        "blockId": "fb_1447_gds_return_0",
        "seats": 8
      },
      {
        "blockId": "fb_1447_gds_arrival_7",
        "seats": 8
      },
      {
        "blockId": "fb_1447_gds_return_3",
        "seats": 8
      },
      {
        "blockId": "fb_1447_105",
        "seats": 14
      },
      {
        "blockId": "fb_1447_106",
        "seats": 14
      },
      {
        "blockId": "fb_1447_gds_arrival_11",
        "seats": 9
      },
      {
        "blockId": "fb_1447_gds_return_13",
        "seats": 9
      },
      {
        "blockId": "fb_1447_gds_arrival_4",
        "seats": 7
      },
      {
        "blockId": "fb_1447_gds_return_8",
        "seats": 3
      },
      {
        "blockId": "fb_1447_gds_return_1",
        "seats": 10
      },
      {
        "blockId": "fb_1447_gds_arrival_2",
        "seats": 6
      },
      {
        "blockId": "fb_1447_gds_arrival_19",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_return_18",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_arrival_16",
        "seats": 3
      },
      {
        "blockId": "fb_1447_gds_return_15",
        "seats": 3
      },
      {
        "blockId": "fb_1447_gds_arrival_5",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_return_7",
        "seats": 4
      },
      {
        "blockId": "fb_1447_gds_arrival_12",
        "seats": 5
      },
      {
        "blockId": "fb_1447_gds_return_11",
        "seats": 5
      },
      {
        "blockId": "fb_1447_gds_arrival_1",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_return_9",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_arrival_22",
        "seats": 2
      }
    ],
    "room_mix": {
      "2": 21,
      "3": 15,
      "4": 54
    },
    "publish_status": "approved",
    "sale_status": "unavailable",
    "content_ready_ar": true,
    "content_ready_en": true,
    "hero_approved": true
  },
  {
    "id": "pkg_1447_03",
    "package_no": "03",
    "name_en": "ITHRAA ALKHAIR 03",
    "tier": "luxury",
    "variant_suffix": "",
    "capacity": 143,
    "initial_price_sar": 33411.64,
    "legs": [
      {
        "id": "leg_1447_03_0",
        "role": "first",
        "hotelId": "h_haram",
        "starts_on": "2027-05-29",
        "ends_on": "2027-06-01"
      },
      {
        "id": "leg_1447_03_1",
        "role": "second",
        "hotelId": "h_pullman",
        "starts_on": "2027-06-01",
        "ends_on": "2027-06-08"
      }
    ],
    "contractIds": [
      "hc_1447_13",
      "hc_1447_17"
    ],
    "flightAllocations": [
      {
        "blockId": "fb_1447_86",
        "seats": 39
      },
      {
        "blockId": "fb_1447_9",
        "seats": 39
      },
      {
        "blockId": "fb_1447_gds_arrival_2",
        "seats": 24
      },
      {
        "blockId": "fb_1447_gds_return_1",
        "seats": 25
      },
      {
        "blockId": "fb_1447_gds_arrival_1",
        "seats": 5
      },
      {
        "blockId": "fb_1447_gds_return_9",
        "seats": 5
      },
      {
        "blockId": "fb_1447_gds_arrival_17",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_return_20",
        "seats": 1
      },
      {
        "blockId": "fb_1447_55",
        "seats": 58
      },
      {
        "blockId": "fb_1447_6",
        "seats": 58
      },
      {
        "blockId": "fb_1447_gds_arrival_7",
        "seats": 7
      },
      {
        "blockId": "fb_1447_gds_return_3",
        "seats": 7
      },
      {
        "blockId": "fb_1447_gds_arrival_0",
        "seats": 1
      },
      {
        "blockId": "fb_1447_gds_return_0",
        "seats": 1
      },
      {
        "blockId": "fb_1447_gds_arrival_16",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_return_15",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_arrival_4",
        "seats": 1
      },
      {
        "blockId": "fb_1447_gds_return_8",
        "seats": 1
      },
      {
        "blockId": "fb_1447_gds_arrival_13",
        "seats": 1
      },
      {
        "blockId": "fb_1447_gds_return_12",
        "seats": 1
      }
    ],
    "room_mix": {
      "2": 37,
      "3": 27,
      "4": 79
    },
    "publish_status": "approved",
    "sale_status": "unavailable",
    "content_ready_ar": true,
    "content_ready_en": true,
    "hero_approved": true
  },
  {
    "id": "pkg_1447_04",
    "package_no": "04",
    "name_en": "ITHRAA ALKHAIR 04",
    "tier": "luxury",
    "variant_suffix": "",
    "capacity": 100,
    "initial_price_sar": 30843.91,
    "legs": [
      {
        "id": "leg_1447_04_0",
        "role": "first",
        "hotelId": "h_haram",
        "starts_on": "2027-05-20",
        "ends_on": "2027-05-24"
      },
      {
        "id": "leg_1447_04_1",
        "role": "second",
        "hotelId": "h_pullman",
        "starts_on": "2027-05-24",
        "ends_on": "2027-05-29"
      },
      {
        "id": "leg_1447_04_2",
        "role": "transitional",
        "hotelId": "h_aziziyah",
        "starts_on": "2027-05-29",
        "ends_on": "2027-06-08"
      }
    ],
    "contractIds": [
      "hc_1447_10",
      "hc_1447_12",
      "hc_1447_14"
    ],
    "flightAllocations": [
      {
        "blockId": "fb_1447_69",
        "seats": 47
      },
      {
        "blockId": "fb_1447_6",
        "seats": 47
      },
      {
        "blockId": "fb_1447_12",
        "seats": 47
      },
      {
        "blockId": "fb_1447_9",
        "seats": 47
      },
      {
        "blockId": "fb_1447_gds_arrival_5",
        "seats": 3
      },
      {
        "blockId": "fb_1447_gds_return_7",
        "seats": 3
      }
    ],
    "room_mix": {
      "2": 35,
      "3": 27,
      "4": 38
    },
    "publish_status": "approved",
    "sale_status": "unavailable",
    "content_ready_ar": true,
    "content_ready_en": true,
    "hero_approved": true
  },
  {
    "id": "pkg_1447_05",
    "package_no": "05",
    "name_en": "ITHRAA ALKHAIR 05",
    "tier": "luxury",
    "variant_suffix": "",
    "capacity": 100,
    "initial_price_sar": 29273.77,
    "legs": [
      {
        "id": "leg_1447_05_0",
        "role": "first",
        "hotelId": "h_pullman",
        "starts_on": "2027-06-08",
        "ends_on": "2027-06-12"
      },
      {
        "id": "leg_1447_05_1",
        "role": "second",
        "hotelId": "h_haram",
        "starts_on": "2027-06-12",
        "ends_on": "2027-06-16"
      },
      {
        "id": "leg_1447_05_2",
        "role": "transitional",
        "hotelId": "h_aziziyah",
        "starts_on": "2027-05-29",
        "ends_on": "2027-06-08"
      }
    ],
    "contractIds": [
      "hc_1447_9",
      "hc_1447_12",
      "hc_1447_20"
    ],
    "flightAllocations": [
      {
        "blockId": "fb_1447_76",
        "seats": 46
      },
      {
        "blockId": "fb_1447_4",
        "seats": 95
      },
      {
        "blockId": "fb_1447_61",
        "seats": 49
      },
      {
        "blockId": "fb_1447_gds_arrival_6",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_return_6",
        "seats": 2
      }
    ],
    "room_mix": {
      "2": 38,
      "3": 26,
      "4": 36
    },
    "publish_status": "approved",
    "sale_status": "unavailable",
    "content_ready_ar": true,
    "content_ready_en": true,
    "hero_approved": true
  },
  {
    "id": "pkg_1447_06",
    "package_no": "06",
    "name_en": "ITHRAA ALKHAIR 06",
    "tier": "luxury",
    "variant_suffix": "",
    "capacity": 143,
    "initial_price_sar": 31879.45,
    "legs": [
      {
        "id": "leg_1447_06_0",
        "role": "first",
        "hotelId": "h_haram",
        "starts_on": "2027-05-26",
        "ends_on": "2027-05-29"
      },
      {
        "id": "leg_1447_06_1",
        "role": "second",
        "hotelId": "h_pullman",
        "starts_on": "2027-05-29",
        "ends_on": "2027-06-01"
      },
      {
        "id": "leg_1447_06_2",
        "role": "transitional",
        "hotelId": "h_aziziyah",
        "starts_on": "2027-06-01",
        "ends_on": "2027-06-09"
      }
    ],
    "contractIds": [
      "hc_1447_12",
      "hc_1447_13",
      "hc_1447_16"
    ],
    "flightAllocations": [
      {
        "blockId": "fb_1447_gds_arrival_4",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_return_8",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_arrival_1",
        "seats": 6
      },
      {
        "blockId": "fb_1447_gds_return_9",
        "seats": 7
      },
      {
        "blockId": "fb_1447_87",
        "seats": 39
      },
      {
        "blockId": "fb_1447_88",
        "seats": 39
      },
      {
        "blockId": "fb_1447_66",
        "seats": 48
      },
      {
        "blockId": "fb_1447_67",
        "seats": 48
      },
      {
        "blockId": "fb_1447_gds_arrival_5",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_return_7",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_arrival_2",
        "seats": 28
      },
      {
        "blockId": "fb_1447_gds_return_1",
        "seats": 28
      },
      {
        "blockId": "fb_1447_gds_arrival_11",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_return_13",
        "seats": 1
      },
      {
        "blockId": "fb_1447_gds_arrival_16",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_return_15",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_arrival_3",
        "seats": 1
      },
      {
        "blockId": "fb_1447_gds_return_4",
        "seats": 1
      },
      {
        "blockId": "fb_1447_gds_arrival_13",
        "seats": 1
      },
      {
        "blockId": "fb_1447_gds_return_12",
        "seats": 1
      },
      {
        "blockId": "fb_1447_gds_arrival_7",
        "seats": 3
      },
      {
        "blockId": "fb_1447_gds_return_3",
        "seats": 3
      },
      {
        "blockId": "fb_1447_gds_arrival_0",
        "seats": 4
      },
      {
        "blockId": "fb_1447_gds_return_0",
        "seats": 4
      }
    ],
    "room_mix": {
      "2": 38,
      "3": 28,
      "4": 77
    },
    "publish_status": "approved",
    "sale_status": "unavailable",
    "content_ready_ar": true,
    "content_ready_en": true,
    "hero_approved": true
  },
  {
    "id": "pkg_1447_07",
    "package_no": "07",
    "name_en": "ITHRAA ALKHAIR 07",
    "tier": "premium",
    "variant_suffix": "",
    "capacity": 240,
    "initial_price_sar": 27684.75,
    "legs": [
      {
        "id": "leg_1447_07_0",
        "role": "first",
        "hotelId": "h_taqwa",
        "starts_on": "2027-05-20",
        "ends_on": "2027-05-23"
      },
      {
        "id": "leg_1447_07_1",
        "role": "second",
        "hotelId": "h_voco",
        "starts_on": "2027-05-23",
        "ends_on": "2027-06-08"
      }
    ],
    "contractIds": [
      "hc_1447_25",
      "hc_1447_28"
    ],
    "flightAllocations": [
      {
        "blockId": "fb_1447_32",
        "seats": 85
      },
      {
        "blockId": "fb_1447_33",
        "seats": 85
      },
      {
        "blockId": "fb_1447_1",
        "seats": 131
      },
      {
        "blockId": "fb_1447_0",
        "seats": 131
      },
      {
        "blockId": "fb_1447_gds_arrival_18",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_return_1",
        "seats": 7
      },
      {
        "blockId": "fb_1447_gds_arrival_2",
        "seats": 5
      },
      {
        "blockId": "fb_1447_gds_arrival_10",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_return_6",
        "seats": 4
      },
      {
        "blockId": "fb_1447_gds_arrival_5",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_return_7",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_arrival_7",
        "seats": 5
      },
      {
        "blockId": "fb_1447_gds_return_3",
        "seats": 5
      },
      {
        "blockId": "fb_1447_gds_arrival_6",
        "seats": 2
      }
    ],
    "room_mix": {
      "2": 44,
      "3": 50,
      "4": 146
    },
    "publish_status": "approved",
    "sale_status": "unavailable",
    "content_ready_ar": true,
    "content_ready_en": true,
    "hero_approved": true
  },
  {
    "id": "pkg_1447_08",
    "package_no": "08",
    "name_en": "ITHRAA ALKHAIR 08",
    "tier": "premium",
    "variant_suffix": "",
    "capacity": 48,
    "initial_price_sar": 27684.75,
    "legs": [
      {
        "id": "leg_1447_08_0",
        "role": "first",
        "hotelId": "h_taqwa",
        "starts_on": "2027-05-20",
        "ends_on": "2027-05-23"
      },
      {
        "id": "leg_1447_08_1",
        "role": "second",
        "hotelId": "h_voco",
        "starts_on": "2027-05-23",
        "ends_on": "2027-06-10"
      }
    ],
    "contractIds": [
      "hc_1447_25",
      "hc_1447_28"
    ],
    "flightAllocations": [
      {
        "blockId": "fb_1447_7",
        "seats": 42
      },
      {
        "blockId": "fb_1447_8",
        "seats": 42
      },
      {
        "blockId": "fb_1447_gds_arrival_2",
        "seats": 3
      },
      {
        "blockId": "fb_1447_gds_return_1",
        "seats": 3
      },
      {
        "blockId": "fb_1447_gds_arrival_8",
        "seats": 1
      },
      {
        "blockId": "fb_1447_gds_return_5",
        "seats": 1
      }
    ],
    "room_mix": {
      "2": 2,
      "3": 6,
      "4": 40
    },
    "publish_status": "approved",
    "sale_status": "unavailable",
    "content_ready_ar": true,
    "content_ready_en": true,
    "hero_approved": true
  },
  {
    "id": "pkg_1447_09",
    "package_no": "09",
    "name_en": "ITHRAA ALKHAIR 09",
    "tier": "premium",
    "variant_suffix": "",
    "capacity": 94,
    "initial_price_sar": 27684.75,
    "legs": [
      {
        "id": "leg_1447_09_0",
        "role": "first",
        "hotelId": "h_taqwa",
        "starts_on": "2027-05-23",
        "ends_on": "2027-05-26"
      },
      {
        "id": "leg_1447_09_1",
        "role": "second",
        "hotelId": "h_voco",
        "starts_on": "2027-05-26",
        "ends_on": "2027-06-10"
      }
    ],
    "contractIds": [
      "hc_1447_25",
      "hc_1447_28"
    ],
    "flightAllocations": [
      {
        "blockId": "fb_1447_gds_arrival_6",
        "seats": 9
      },
      {
        "blockId": "fb_1447_gds_return_6",
        "seats": 7
      },
      {
        "blockId": "fb_1447_gds_arrival_5",
        "seats": 12
      },
      {
        "blockId": "fb_1447_gds_return_7",
        "seats": 10
      },
      {
        "blockId": "fb_1447_gds_arrival_4",
        "seats": 10
      },
      {
        "blockId": "fb_1447_gds_return_8",
        "seats": 9
      },
      {
        "blockId": "fb_1447_gds_arrival_11",
        "seats": 1
      },
      {
        "blockId": "fb_1447_gds_return_9",
        "seats": 1
      },
      {
        "blockId": "fb_1447_gds_arrival_14",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_return_14",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_arrival_0",
        "seats": 30
      },
      {
        "blockId": "fb_1447_gds_return_0",
        "seats": 30
      },
      {
        "blockId": "fb_1447_gds_return_17",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_arrival_2",
        "seats": 21
      },
      {
        "blockId": "fb_1447_gds_return_1",
        "seats": 23
      },
      {
        "blockId": "fb_1447_gds_arrival_7",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_return_3",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_return_5",
        "seats": 1
      },
      {
        "blockId": "fb_1447_gds_arrival_13",
        "seats": 3
      },
      {
        "blockId": "fb_1447_gds_return_12",
        "seats": 3
      }
    ],
    "room_mix": {
      "2": 17,
      "3": 19,
      "4": 58
    },
    "publish_status": "approved",
    "sale_status": "unavailable",
    "content_ready_ar": true,
    "content_ready_en": true,
    "hero_approved": true
  },
  {
    "id": "pkg_1447_10",
    "package_no": "10",
    "name_en": "ITHRAA ALKHAIR 10",
    "tier": "premium",
    "variant_suffix": "",
    "capacity": 194,
    "initial_price_sar": 27684.75,
    "legs": [
      {
        "id": "leg_1447_10_0",
        "role": "first",
        "hotelId": "h_taqwa",
        "starts_on": "2027-05-23",
        "ends_on": "2027-05-26"
      },
      {
        "id": "leg_1447_10_1",
        "role": "second",
        "hotelId": "h_voco",
        "starts_on": "2027-05-26",
        "ends_on": "2027-06-08"
      }
    ],
    "contractIds": [
      "hc_1447_25",
      "hc_1447_28"
    ],
    "flightAllocations": [
      {
        "blockId": "fb_1447_62",
        "seats": 48
      },
      {
        "blockId": "fb_1447_63",
        "seats": 48
      },
      {
        "blockId": "fb_1447_25",
        "seats": 92
      },
      {
        "blockId": "fb_1447_5",
        "seats": 92
      },
      {
        "blockId": "fb_1447_gds_arrival_0",
        "seats": 26
      },
      {
        "blockId": "fb_1447_gds_return_0",
        "seats": 26
      },
      {
        "blockId": "fb_1447_gds_arrival_2",
        "seats": 17
      },
      {
        "blockId": "fb_1447_gds_return_1",
        "seats": 17
      },
      {
        "blockId": "fb_1447_gds_arrival_4",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_return_5",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_arrival_7",
        "seats": 3
      },
      {
        "blockId": "fb_1447_gds_return_3",
        "seats": 3
      },
      {
        "blockId": "fb_1447_gds_arrival_5",
        "seats": 1
      },
      {
        "blockId": "fb_1447_gds_return_7",
        "seats": 1
      }
    ],
    "room_mix": {
      "2": 30,
      "3": 38,
      "4": 126
    },
    "publish_status": "approved",
    "sale_status": "unavailable",
    "content_ready_ar": true,
    "content_ready_en": true,
    "hero_approved": true
  },
  {
    "id": "pkg_1447_11",
    "package_no": "11",
    "name_en": "ITHRAA ALKHAIR 11",
    "tier": "premium",
    "variant_suffix": "",
    "capacity": 288,
    "initial_price_sar": 27684.75,
    "legs": [
      {
        "id": "leg_1447_11_0",
        "role": "first",
        "hotelId": "h_taqwa",
        "starts_on": "2027-05-26",
        "ends_on": "2027-05-29"
      },
      {
        "id": "leg_1447_11_1",
        "role": "second",
        "hotelId": "h_voco",
        "starts_on": "2027-05-29",
        "ends_on": "2027-06-09"
      }
    ],
    "contractIds": [
      "hc_1447_25",
      "hc_1447_27"
    ],
    "flightAllocations": [
      {
        "blockId": "fb_1447_65",
        "seats": 48
      },
      {
        "blockId": "fb_1447_30",
        "seats": 89
      },
      {
        "blockId": "fb_1447_85",
        "seats": 41
      },
      {
        "blockId": "fb_1447_53",
        "seats": 65
      },
      {
        "blockId": "fb_1447_52",
        "seats": 66
      },
      {
        "blockId": "fb_1447_gds_arrival_2",
        "seats": 21
      },
      {
        "blockId": "fb_1447_gds_return_1",
        "seats": 21
      },
      {
        "blockId": "fb_1447_gds_arrival_0",
        "seats": 76
      },
      {
        "blockId": "fb_1447_gds_return_0",
        "seats": 76
      },
      {
        "blockId": "fb_1447_gds_arrival_5",
        "seats": 11
      },
      {
        "blockId": "fb_1447_gds_return_7",
        "seats": 11
      },
      {
        "blockId": "fb_1447_gds_arrival_4",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_return_8",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_arrival_11",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_return_13",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_arrival_7",
        "seats": 5
      },
      {
        "blockId": "fb_1447_gds_return_3",
        "seats": 5
      },
      {
        "blockId": "fb_1447_96",
        "seats": 1
      },
      {
        "blockId": "fb_1447_gds_arrival_13",
        "seats": 1
      },
      {
        "blockId": "fb_1447_gds_return_12",
        "seats": 1
      },
      {
        "blockId": "fb_1447_gds_arrival_6",
        "seats": 1
      },
      {
        "blockId": "fb_1447_gds_return_6",
        "seats": 1
      },
      {
        "blockId": "fb_1447_gds_arrival_8",
        "seats": 3
      },
      {
        "blockId": "fb_1447_gds_return_5",
        "seats": 3
      },
      {
        "blockId": "fb_1447_gds_arrival_25",
        "seats": 1
      },
      {
        "blockId": "fb_1447_gds_return_22",
        "seats": 1
      }
    ],
    "room_mix": {
      "2": 48,
      "3": 54,
      "4": 186
    },
    "publish_status": "approved",
    "sale_status": "unavailable",
    "content_ready_ar": true,
    "content_ready_en": true,
    "hero_approved": true
  },
  {
    "id": "pkg_1447_12",
    "package_no": "12",
    "name_en": "ITHRAA ALKHAIR 12",
    "tier": "premium",
    "variant_suffix": "",
    "capacity": 278,
    "initial_price_sar": 28723.77,
    "legs": [
      {
        "id": "leg_1447_12_0",
        "role": "first",
        "hotelId": "h_voco",
        "starts_on": "2027-05-28",
        "ends_on": "2027-06-08"
      },
      {
        "id": "leg_1447_12_1",
        "role": "second",
        "hotelId": "h_taqwa",
        "starts_on": "2027-06-08",
        "ends_on": "2027-06-12"
      }
    ],
    "contractIds": [
      "hc_1447_25",
      "hc_1447_26"
    ],
    "flightAllocations": [
      {
        "blockId": "fb_1447_36",
        "seats": 82
      },
      {
        "blockId": "fb_1447_37",
        "seats": 82
      },
      {
        "blockId": "fb_1447_gds_arrival_2",
        "seats": 19
      },
      {
        "blockId": "fb_1447_gds_return_1",
        "seats": 19
      },
      {
        "blockId": "fb_1447_39",
        "seats": 41
      },
      {
        "blockId": "fb_1447_40",
        "seats": 41
      },
      {
        "blockId": "fb_1447_gds_arrival_0",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_return_0",
        "seats": 2
      },
      {
        "blockId": "fb_1447_41",
        "seats": 41
      },
      {
        "blockId": "fb_1447_2",
        "seats": 41
      },
      {
        "blockId": "fb_1447_68",
        "seats": 48
      },
      {
        "blockId": "fb_1447_26",
        "seats": 48
      },
      {
        "blockId": "fb_1447_gds_arrival_3",
        "seats": 4
      },
      {
        "blockId": "fb_1447_gds_return_4",
        "seats": 4
      },
      {
        "blockId": "fb_1447_gds_arrival_13",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_return_12",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_arrival_5",
        "seats": 8
      },
      {
        "blockId": "fb_1447_gds_return_7",
        "seats": 8
      },
      {
        "blockId": "fb_1447_gds_arrival_4",
        "seats": 6
      },
      {
        "blockId": "fb_1447_gds_return_8",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_arrival_9",
        "seats": 7
      },
      {
        "blockId": "fb_1447_gds_return_2",
        "seats": 7
      },
      {
        "blockId": "fb_1447_gds_arrival_11",
        "seats": 1
      },
      {
        "blockId": "fb_1447_gds_return_13",
        "seats": 1
      },
      {
        "blockId": "fb_1447_gds_arrival_7",
        "seats": 4
      },
      {
        "blockId": "fb_1447_gds_return_3",
        "seats": 4
      },
      {
        "blockId": "fb_1447_gds_arrival_1",
        "seats": 1
      },
      {
        "blockId": "fb_1447_gds_return_9",
        "seats": 1
      },
      {
        "blockId": "fb_1447_gds_return_5",
        "seats": 4
      },
      {
        "blockId": "fb_1447_gds_arrival_16",
        "seats": 1
      },
      {
        "blockId": "fb_1447_gds_return_15",
        "seats": 1
      }
    ],
    "room_mix": {
      "2": 50,
      "3": 53,
      "4": 175
    },
    "publish_status": "approved",
    "sale_status": "unavailable",
    "content_ready_ar": true,
    "content_ready_en": true,
    "hero_approved": true
  },
  {
    "id": "pkg_1447_13",
    "package_no": "13",
    "name_en": "ITHRAA ALKHAIR 13",
    "tier": "premium",
    "variant_suffix": "",
    "capacity": 276,
    "initial_price_sar": 27778.6,
    "legs": [
      {
        "id": "leg_1447_13_0",
        "role": "first",
        "hotelId": "h_voco",
        "starts_on": "2027-05-29",
        "ends_on": "2027-06-12"
      },
      {
        "id": "leg_1447_13_1",
        "role": "second",
        "hotelId": "h_taqwa",
        "starts_on": "2027-06-12",
        "ends_on": "2027-06-15"
      }
    ],
    "contractIds": [
      "hc_1447_25",
      "hc_1447_26"
    ],
    "flightAllocations": [
      {
        "blockId": "fb_1447_3",
        "seats": 82
      },
      {
        "blockId": "fb_1447_38",
        "seats": 82
      },
      {
        "blockId": "fb_1447_43",
        "seats": 60
      },
      {
        "blockId": "fb_1447_4",
        "seats": 60
      },
      {
        "blockId": "fb_1447_gds_arrival_2",
        "seats": 23
      },
      {
        "blockId": "fb_1447_gds_return_1",
        "seats": 23
      },
      {
        "blockId": "fb_1447_34",
        "seats": 83
      },
      {
        "blockId": "fb_1447_35",
        "seats": 83
      },
      {
        "blockId": "fb_1447_gds_arrival_0",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_return_0",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_arrival_5",
        "seats": 8
      },
      {
        "blockId": "fb_1447_gds_return_7",
        "seats": 8
      },
      {
        "blockId": "fb_1447_gds_arrival_1",
        "seats": 1
      },
      {
        "blockId": "fb_1447_gds_return_9",
        "seats": 1
      },
      {
        "blockId": "fb_1447_gds_arrival_4",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_return_8",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_arrival_10",
        "seats": 6
      },
      {
        "blockId": "fb_1447_gds_return_10",
        "seats": 6
      }
    ],
    "room_mix": {
      "2": 49,
      "3": 55,
      "4": 172
    },
    "publish_status": "approved",
    "sale_status": "unavailable",
    "content_ready_ar": true,
    "content_ready_en": true,
    "hero_approved": true
  },
  {
    "id": "pkg_1447_14",
    "package_no": "14",
    "name_en": "ITHRAA ALKHAIR 14",
    "tier": "standard",
    "variant_suffix": "",
    "capacity": 528,
    "initial_price_sar": 22465.8,
    "legs": [
      {
        "id": "leg_1447_14_0",
        "role": "first",
        "hotelId": "h_maysan",
        "starts_on": "2027-05-23",
        "ends_on": "2027-05-27"
      },
      {
        "id": "leg_1447_14_1",
        "role": "second",
        "hotelId": "h_aziziyah",
        "starts_on": "2027-05-27",
        "ends_on": "2027-06-08"
      }
    ],
    "contractIds": [
      "hc_1447_2",
      "hc_1447_12"
    ],
    "flightAllocations": [
      {
        "blockId": "fb_1447_11",
        "seats": 128
      },
      {
        "blockId": "fb_1447_50",
        "seats": 69
      },
      {
        "blockId": "fb_1447_97",
        "seats": 21
      },
      {
        "blockId": "fb_1447_98",
        "seats": 21
      },
      {
        "blockId": "fb_1447_64",
        "seats": 48
      },
      {
        "blockId": "fb_1447_109",
        "seats": 11
      },
      {
        "blockId": "fb_1447_gds_arrival_10",
        "seats": 6
      },
      {
        "blockId": "fb_1447_gds_return_10",
        "seats": 1
      },
      {
        "blockId": "fb_1447_gds_arrival_5",
        "seats": 12
      },
      {
        "blockId": "fb_1447_gds_return_1",
        "seats": 84
      },
      {
        "blockId": "fb_1447_59",
        "seats": 49
      },
      {
        "blockId": "fb_1447_60",
        "seats": 49
      },
      {
        "blockId": "fb_1447_gds_arrival_2",
        "seats": 81
      },
      {
        "blockId": "fb_1447_gds_return_2",
        "seats": 1
      },
      {
        "blockId": "fb_1447_20",
        "seats": 95
      },
      {
        "blockId": "fb_1447_21",
        "seats": 95
      },
      {
        "blockId": "fb_1447_gds_arrival_4",
        "seats": 4
      },
      {
        "blockId": "fb_1447_gds_return_8",
        "seats": 4
      },
      {
        "blockId": "fb_1447_gds_arrival_1",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_return_13",
        "seats": 5
      },
      {
        "blockId": "fb_1447_gds_arrival_6",
        "seats": 13
      },
      {
        "blockId": "fb_1447_gds_return_6",
        "seats": 18
      },
      {
        "blockId": "fb_1447_gds_arrival_0",
        "seats": 26
      },
      {
        "blockId": "fb_1447_gds_return_0",
        "seats": 26
      },
      {
        "blockId": "fb_1447_gds_arrival_11",
        "seats": 5
      },
      {
        "blockId": "fb_1447_gds_return_9",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_arrival_23",
        "seats": 1
      },
      {
        "blockId": "fb_1447_gds_return_21",
        "seats": 1
      },
      {
        "blockId": "fb_1447_gds_arrival_7",
        "seats": 33
      },
      {
        "blockId": "fb_1447_gds_return_3",
        "seats": 33
      },
      {
        "blockId": "fb_1447_gds_arrival_16",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_return_15",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_return_7",
        "seats": 8
      },
      {
        "blockId": "fb_1447_gds_arrival_8",
        "seats": 21
      },
      {
        "blockId": "fb_1447_gds_return_5",
        "seats": 21
      },
      {
        "blockId": "fb_1447_gds_arrival_3",
        "seats": 15
      },
      {
        "blockId": "fb_1447_gds_return_4",
        "seats": 15
      },
      {
        "blockId": "fb_1447_gds_arrival_13",
        "seats": 3
      },
      {
        "blockId": "fb_1447_gds_return_12",
        "seats": 3
      }
    ],
    "room_mix": {
      "2": 0,
      "3": 0,
      "4": 528
    },
    "publish_status": "approved",
    "sale_status": "unavailable",
    "content_ready_ar": true,
    "content_ready_en": true,
    "hero_approved": true
  },
  {
    "id": "pkg_1447_15",
    "package_no": "15",
    "name_en": "ITHRAA ALKHAIR 15",
    "tier": "standard",
    "variant_suffix": "",
    "capacity": 96,
    "initial_price_sar": 22672.26,
    "legs": [
      {
        "id": "leg_1447_15_0",
        "role": "first",
        "hotelId": "h_maysan",
        "starts_on": "2027-05-23",
        "ends_on": "2027-05-26"
      },
      {
        "id": "leg_1447_15_1",
        "role": "second",
        "hotelId": "h_aziziyah",
        "starts_on": "2027-05-26",
        "ends_on": "2027-06-08"
      }
    ],
    "contractIds": [
      "hc_1447_1",
      "hc_1447_8"
    ],
    "flightAllocations": [
      {
        "blockId": "fb_1447_28",
        "seats": 89
      },
      {
        "blockId": "fb_1447_29",
        "seats": 89
      },
      {
        "blockId": "fb_1447_gds_arrival_4",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_return_8",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_arrival_7",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_return_3",
        "seats": 2
      }
    ],
    "room_mix": {
      "2": 0,
      "3": 0,
      "4": 96
    },
    "publish_status": "approved",
    "sale_status": "unavailable",
    "content_ready_ar": true,
    "content_ready_en": true,
    "hero_approved": true
  },
  {
    "id": "pkg_1447_16",
    "package_no": "16",
    "name_en": "ITHRAA ALKHAIR 16",
    "tier": "standard",
    "variant_suffix": "",
    "capacity": 200,
    "initial_price_sar": 21826.54,
    "legs": [
      {
        "id": "leg_1447_16_0",
        "role": "first",
        "hotelId": "h_maysan",
        "starts_on": "2027-05-27",
        "ends_on": "2027-05-30"
      },
      {
        "id": "leg_1447_16_1",
        "role": "second",
        "hotelId": "h_aziziyah",
        "starts_on": "2027-05-30",
        "ends_on": "2027-06-10"
      }
    ],
    "contractIds": [
      "hc_1447_4",
      "hc_1447_12"
    ],
    "flightAllocations": [
      {
        "blockId": "fb_1447_gds_arrival_2",
        "seats": 56
      },
      {
        "blockId": "fb_1447_gds_return_1",
        "seats": 61
      },
      {
        "blockId": "fb_1447_gds_arrival_6",
        "seats": 9
      },
      {
        "blockId": "fb_1447_gds_return_6",
        "seats": 5
      },
      {
        "blockId": "fb_1447_117",
        "seats": 4
      },
      {
        "blockId": "fb_1447_118",
        "seats": 4
      },
      {
        "blockId": "fb_1447_gds_arrival_5",
        "seats": 22
      },
      {
        "blockId": "fb_1447_96",
        "seats": 21
      },
      {
        "blockId": "fb_1447_99",
        "seats": 21
      },
      {
        "blockId": "fb_1447_gds_arrival_4",
        "seats": 36
      },
      {
        "blockId": "fb_1447_gds_return_8",
        "seats": 36
      },
      {
        "blockId": "fb_1447_gds_return_7",
        "seats": 18
      },
      {
        "blockId": "fb_1447_gds_arrival_15",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_return_5",
        "seats": 19
      },
      {
        "blockId": "fb_1447_gds_arrival_7",
        "seats": 4
      },
      {
        "blockId": "fb_1447_gds_return_3",
        "seats": 4
      },
      {
        "blockId": "fb_1447_gds_return_0",
        "seats": 8
      },
      {
        "blockId": "fb_1447_gds_arrival_1",
        "seats": 14
      },
      {
        "blockId": "fb_1447_gds_return_9",
        "seats": 14
      },
      {
        "blockId": "fb_1447_gds_arrival_0",
        "seats": 7
      },
      {
        "blockId": "fb_1447_gds_return_17",
        "seats": 3
      },
      {
        "blockId": "fb_1447_gds_arrival_10",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_return_10",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_arrival_8",
        "seats": 18
      }
    ],
    "room_mix": {
      "2": 0,
      "3": 0,
      "4": 200
    },
    "publish_status": "approved",
    "sale_status": "unavailable",
    "content_ready_ar": true,
    "content_ready_en": true,
    "hero_approved": true
  },
  {
    "id": "pkg_1447_17",
    "package_no": "17",
    "name_en": "ITHRAA ALKHAIR 17",
    "tier": "standard",
    "variant_suffix": "",
    "capacity": 328,
    "initial_price_sar": 22149.86,
    "legs": [
      {
        "id": "leg_1447_17_0",
        "role": "first",
        "hotelId": "h_maysan",
        "starts_on": "2027-05-27",
        "ends_on": "2027-05-30"
      },
      {
        "id": "leg_1447_17_1",
        "role": "second",
        "hotelId": "h_aziziyah",
        "starts_on": "2027-05-30",
        "ends_on": "2027-06-12"
      }
    ],
    "contractIds": [
      "hc_1447_4",
      "hc_1447_12"
    ],
    "flightAllocations": [
      {
        "blockId": "fb_1447_23",
        "seats": 93
      },
      {
        "blockId": "fb_1447_2",
        "seats": 111
      },
      {
        "blockId": "fb_1447_84",
        "seats": 42
      },
      {
        "blockId": "fb_1447_26",
        "seats": 42
      },
      {
        "blockId": "fb_1447_119",
        "seats": 2
      },
      {
        "blockId": "fb_1447_120",
        "seats": 2
      },
      {
        "blockId": "fb_1447_95",
        "seats": 11
      },
      {
        "blockId": "fb_1447_14",
        "seats": 11
      },
      {
        "blockId": "fb_1447_gds_arrival_2",
        "seats": 26
      },
      {
        "blockId": "fb_1447_gds_return_1",
        "seats": 26
      },
      {
        "blockId": "fb_1447_41",
        "seats": 18
      },
      {
        "blockId": "fb_1447_gds_arrival_9",
        "seats": 8
      },
      {
        "blockId": "fb_1447_gds_return_2",
        "seats": 8
      },
      {
        "blockId": "fb_1447_103",
        "seats": 15
      },
      {
        "blockId": "fb_1447_104",
        "seats": 15
      },
      {
        "blockId": "fb_1447_gds_arrival_0",
        "seats": 19
      },
      {
        "blockId": "fb_1447_gds_return_0",
        "seats": 19
      },
      {
        "blockId": "fb_1447_gds_arrival_6",
        "seats": 13
      },
      {
        "blockId": "fb_1447_gds_return_6",
        "seats": 14
      },
      {
        "blockId": "fb_1447_gds_arrival_7",
        "seats": 18
      },
      {
        "blockId": "fb_1447_gds_return_3",
        "seats": 18
      },
      {
        "blockId": "fb_1447_gds_arrival_10",
        "seats": 14
      },
      {
        "blockId": "fb_1447_gds_return_10",
        "seats": 13
      },
      {
        "blockId": "fb_1447_gds_arrival_3",
        "seats": 8
      },
      {
        "blockId": "fb_1447_gds_return_4",
        "seats": 8
      },
      {
        "blockId": "fb_1447_gds_arrival_5",
        "seats": 7
      },
      {
        "blockId": "fb_1447_gds_return_7",
        "seats": 7
      },
      {
        "blockId": "fb_1447_gds_arrival_14",
        "seats": 6
      },
      {
        "blockId": "fb_1447_gds_return_14",
        "seats": 6
      },
      {
        "blockId": "fb_1447_gds_arrival_4",
        "seats": 7
      },
      {
        "blockId": "fb_1447_gds_return_8",
        "seats": 7
      },
      {
        "blockId": "fb_1447_gds_arrival_1",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_return_9",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_arrival_8",
        "seats": 11
      },
      {
        "blockId": "fb_1447_gds_return_5",
        "seats": 11
      }
    ],
    "room_mix": {
      "2": 0,
      "3": 0,
      "4": 328
    },
    "publish_status": "approved",
    "sale_status": "unavailable",
    "content_ready_ar": true,
    "content_ready_en": true,
    "hero_approved": true
  },
  {
    "id": "pkg_1447_18",
    "package_no": "18",
    "name_en": "ITHRAA ALKHAIR 18",
    "tier": "standard",
    "variant_suffix": "",
    "capacity": 96,
    "initial_price_sar": 22758.83,
    "legs": [
      {
        "id": "leg_1447_18_0",
        "role": "first",
        "hotelId": "h_maysan",
        "starts_on": "2027-05-26",
        "ends_on": "2027-05-30"
      },
      {
        "id": "leg_1447_18_1",
        "role": "second",
        "hotelId": "h_aziziyah",
        "starts_on": "2027-05-30",
        "ends_on": "2027-06-09"
      }
    ],
    "contractIds": [
      "hc_1447_3",
      "hc_1447_7"
    ],
    "flightAllocations": [
      {
        "blockId": "fb_1447_72",
        "seats": 47
      },
      {
        "blockId": "fb_1447_9",
        "seats": 47
      },
      {
        "blockId": "fb_1447_89",
        "seats": 38
      },
      {
        "blockId": "fb_1447_6",
        "seats": 38
      },
      {
        "blockId": "fb_1447_gds_arrival_3",
        "seats": 1
      },
      {
        "blockId": "fb_1447_gds_return_4",
        "seats": 1
      },
      {
        "blockId": "fb_1447_gds_arrival_2",
        "seats": 5
      },
      {
        "blockId": "fb_1447_gds_return_1",
        "seats": 7
      },
      {
        "blockId": "fb_1447_gds_arrival_7",
        "seats": 1
      },
      {
        "blockId": "fb_1447_gds_return_3",
        "seats": 1
      },
      {
        "blockId": "fb_1447_gds_arrival_14",
        "seats": 2
      }
    ],
    "room_mix": {
      "2": 0,
      "3": 0,
      "4": 96
    },
    "publish_status": "approved",
    "sale_status": "unavailable",
    "content_ready_ar": true,
    "content_ready_en": true,
    "hero_approved": true
  },
  {
    "id": "pkg_1447_19",
    "package_no": "19",
    "name_en": "ITHRAA ALKHAIR 19",
    "tier": "standard",
    "variant_suffix": "",
    "capacity": 292,
    "initial_price_sar": 22266.63,
    "legs": [
      {
        "id": "leg_1447_19_0",
        "role": "first",
        "hotelId": "h_aziziyah",
        "starts_on": "2027-05-29",
        "ends_on": "2027-06-08"
      },
      {
        "id": "leg_1447_19_1",
        "role": "second",
        "hotelId": "h_maysan",
        "starts_on": "2027-06-08",
        "ends_on": "2027-06-12"
      }
    ],
    "contractIds": [
      "hc_1447_11",
      "hc_1447_12"
    ],
    "flightAllocations": [
      {
        "blockId": "fb_1447_48",
        "seats": 50
      },
      {
        "blockId": "fb_1447_49",
        "seats": 50
      },
      {
        "blockId": "fb_1447_gds_arrival_2",
        "seats": 25
      },
      {
        "blockId": "fb_1447_gds_return_1",
        "seats": 36
      },
      {
        "blockId": "fb_1447_10",
        "seats": 90
      },
      {
        "blockId": "fb_1447_27",
        "seats": 90
      },
      {
        "blockId": "fb_1447_39",
        "seats": 39
      },
      {
        "blockId": "fb_1447_40",
        "seats": 39
      },
      {
        "blockId": "fb_1447_gds_arrival_4",
        "seats": 4
      },
      {
        "blockId": "fb_1447_gds_return_8",
        "seats": 4
      },
      {
        "blockId": "fb_1447_54",
        "seats": 32
      },
      {
        "blockId": "fb_1447_90",
        "seats": 32
      },
      {
        "blockId": "fb_1447_gds_arrival_8",
        "seats": 5
      },
      {
        "blockId": "fb_1447_gds_return_5",
        "seats": 5
      },
      {
        "blockId": "fb_1447_gds_arrival_0",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_return_0",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_arrival_1",
        "seats": 14
      },
      {
        "blockId": "fb_1447_gds_return_9",
        "seats": 4
      },
      {
        "blockId": "fb_1447_gds_arrival_5",
        "seats": 10
      },
      {
        "blockId": "fb_1447_gds_return_7",
        "seats": 9
      },
      {
        "blockId": "fb_1447_gds_arrival_3",
        "seats": 12
      },
      {
        "blockId": "fb_1447_gds_return_4",
        "seats": 12
      },
      {
        "blockId": "fb_1447_gds_arrival_7",
        "seats": 1
      },
      {
        "blockId": "fb_1447_gds_return_3",
        "seats": 1
      }
    ],
    "room_mix": {
      "2": 0,
      "3": 0,
      "4": 292
    },
    "publish_status": "approved",
    "sale_status": "unavailable",
    "content_ready_ar": true,
    "content_ready_en": true,
    "hero_approved": true
  },
  {
    "id": "pkg_1447_20",
    "package_no": "20",
    "name_en": "ITHRAA ALKHAIR 20",
    "tier": "standard",
    "variant_suffix": "",
    "capacity": 192,
    "initial_price_sar": 22428.28,
    "legs": [
      {
        "id": "leg_1447_20_0",
        "role": "first",
        "hotelId": "h_aziziyah",
        "starts_on": "2027-05-28",
        "ends_on": "2027-06-08"
      },
      {
        "id": "leg_1447_20_1",
        "role": "second",
        "hotelId": "h_maysan",
        "starts_on": "2027-06-08",
        "ends_on": "2027-06-12"
      }
    ],
    "contractIds": [
      "hc_1447_11",
      "hc_1447_12"
    ],
    "flightAllocations": [
      {
        "blockId": "fb_1447_24",
        "seats": 56
      },
      {
        "blockId": "fb_1447_14",
        "seats": 56
      },
      {
        "blockId": "fb_1447_81",
        "seats": 43
      },
      {
        "blockId": "fb_1447_31",
        "seats": 43
      },
      {
        "blockId": "fb_1447_41",
        "seats": 19
      },
      {
        "blockId": "fb_1447_2",
        "seats": 19
      },
      {
        "blockId": "fb_1447_gds_arrival_2",
        "seats": 17
      },
      {
        "blockId": "fb_1447_gds_return_1",
        "seats": 17
      },
      {
        "blockId": "fb_1447_gds_arrival_7",
        "seats": 20
      },
      {
        "blockId": "fb_1447_gds_return_3",
        "seats": 20
      },
      {
        "blockId": "fb_1447_gds_arrival_1",
        "seats": 1
      },
      {
        "blockId": "fb_1447_gds_return_9",
        "seats": 1
      },
      {
        "blockId": "fb_1447_gds_arrival_6",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_return_6",
        "seats": 4
      },
      {
        "blockId": "fb_1447_gds_arrival_3",
        "seats": 4
      },
      {
        "blockId": "fb_1447_gds_return_4",
        "seats": 4
      },
      {
        "blockId": "fb_1447_gds_arrival_5",
        "seats": 4
      },
      {
        "blockId": "fb_1447_gds_return_7",
        "seats": 4
      },
      {
        "blockId": "fb_1447_gds_arrival_12",
        "seats": 1
      },
      {
        "blockId": "fb_1447_gds_return_11",
        "seats": 1
      },
      {
        "blockId": "fb_1447_gds_arrival_10",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_arrival_0",
        "seats": 4
      },
      {
        "blockId": "fb_1447_gds_return_0",
        "seats": 4
      },
      {
        "blockId": "fb_1447_gds_arrival_8",
        "seats": 14
      },
      {
        "blockId": "fb_1447_gds_return_5",
        "seats": 14
      }
    ],
    "room_mix": {
      "2": 0,
      "3": 0,
      "4": 192
    },
    "publish_status": "approved",
    "sale_status": "unavailable",
    "content_ready_ar": true,
    "content_ready_en": true,
    "hero_approved": true
  },
  {
    "id": "pkg_1447_21",
    "package_no": "21",
    "name_en": "ITHRAA ALKHAIR 21",
    "tier": "standard",
    "variant_suffix": "",
    "capacity": 500,
    "initial_price_sar": 22896.37,
    "legs": [
      {
        "id": "leg_1447_21_0",
        "role": "first",
        "hotelId": "h_aziziyah",
        "starts_on": "2027-05-29",
        "ends_on": "2027-06-12"
      },
      {
        "id": "leg_1447_21_1",
        "role": "second",
        "hotelId": "h_maysan",
        "starts_on": "2027-06-12",
        "ends_on": "2027-06-16"
      }
    ],
    "contractIds": [
      "hc_1447_0",
      "hc_1447_12"
    ],
    "flightAllocations": [
      {
        "blockId": "fb_1447_13",
        "seats": 94
      },
      {
        "blockId": "fb_1447_22",
        "seats": 94
      },
      {
        "blockId": "fb_1447_gds_arrival_7",
        "seats": 6
      },
      {
        "blockId": "fb_1447_gds_return_3",
        "seats": 6
      },
      {
        "blockId": "fb_1447_3",
        "seats": 95
      },
      {
        "blockId": "fb_1447_19",
        "seats": 95
      },
      {
        "blockId": "fb_1447_gds_arrival_2",
        "seats": 59
      },
      {
        "blockId": "fb_1447_gds_return_1",
        "seats": 66
      },
      {
        "blockId": "fb_1447_116",
        "seats": 4
      },
      {
        "blockId": "fb_1447_100",
        "seats": 20
      },
      {
        "blockId": "fb_1447_46",
        "seats": 71
      },
      {
        "blockId": "fb_1447_47",
        "seats": 71
      },
      {
        "blockId": "fb_1447_79",
        "seats": 45
      },
      {
        "blockId": "fb_1447_80",
        "seats": 45
      },
      {
        "blockId": "fb_1447_43",
        "seats": 16
      },
      {
        "blockId": "fb_1447_gds_arrival_10",
        "seats": 3
      },
      {
        "blockId": "fb_1447_gds_return_10",
        "seats": 3
      },
      {
        "blockId": "fb_1447_gds_arrival_5",
        "seats": 23
      },
      {
        "blockId": "fb_1447_gds_return_7",
        "seats": 23
      },
      {
        "blockId": "fb_1447_gds_arrival_0",
        "seats": 19
      },
      {
        "blockId": "fb_1447_gds_return_0",
        "seats": 19
      },
      {
        "blockId": "fb_1447_gds_arrival_6",
        "seats": 15
      },
      {
        "blockId": "fb_1447_gds_return_6",
        "seats": 15
      },
      {
        "blockId": "fb_1447_gds_arrival_11",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_return_13",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_arrival_4",
        "seats": 11
      },
      {
        "blockId": "fb_1447_gds_return_8",
        "seats": 11
      },
      {
        "blockId": "fb_1447_gds_arrival_9",
        "seats": 6
      },
      {
        "blockId": "fb_1447_gds_return_2",
        "seats": 6
      },
      {
        "blockId": "fb_1447_gds_arrival_3",
        "seats": 9
      },
      {
        "blockId": "fb_1447_gds_return_4",
        "seats": 13
      },
      {
        "blockId": "fb_1447_gds_arrival_1",
        "seats": 11
      }
    ],
    "room_mix": {
      "2": 0,
      "3": 0,
      "4": 500
    },
    "publish_status": "approved",
    "sale_status": "unavailable",
    "content_ready_ar": true,
    "content_ready_en": true,
    "hero_approved": true
  },
  {
    "id": "pkg_1447_22",
    "package_no": "22",
    "name_en": "ITHRAA ALKHAIR 22",
    "tier": "standard",
    "variant_suffix": "",
    "capacity": 276,
    "initial_price_sar": 23333.94,
    "legs": [
      {
        "id": "leg_1447_22_0",
        "role": "first",
        "hotelId": "h_durrat",
        "starts_on": "2027-05-20",
        "ends_on": "2027-05-24"
      },
      {
        "id": "leg_1447_22_1",
        "role": "second",
        "hotelId": "h_aziziyah",
        "starts_on": "2027-05-24",
        "ends_on": "2027-06-10"
      }
    ],
    "contractIds": [
      "hc_1447_6",
      "hc_1447_12"
    ],
    "flightAllocations": [
      {
        "blockId": "fb_1447_1",
        "seats": 67
      },
      {
        "blockId": "fb_1447_51",
        "seats": 67
      },
      {
        "blockId": "fb_1447_gds_arrival_8",
        "seats": 4
      },
      {
        "blockId": "fb_1447_gds_return_8",
        "seats": 9
      },
      {
        "blockId": "fb_1447_12",
        "seats": 74
      },
      {
        "blockId": "fb_1447_75",
        "seats": 46
      },
      {
        "blockId": "fb_1447_7",
        "seats": 30
      },
      {
        "blockId": "fb_1447_8",
        "seats": 30
      },
      {
        "blockId": "fb_1447_94",
        "seats": 28
      },
      {
        "blockId": "fb_1447_gds_arrival_7",
        "seats": 12
      },
      {
        "blockId": "fb_1447_gds_return_3",
        "seats": 12
      },
      {
        "blockId": "fb_1447_gds_arrival_5",
        "seats": 7
      },
      {
        "blockId": "fb_1447_gds_return_7",
        "seats": 7
      },
      {
        "blockId": "fb_1447_gds_arrival_0",
        "seats": 21
      },
      {
        "blockId": "fb_1447_gds_return_0",
        "seats": 21
      },
      {
        "blockId": "fb_1447_gds_arrival_2",
        "seats": 45
      },
      {
        "blockId": "fb_1447_gds_return_1",
        "seats": 45
      },
      {
        "blockId": "fb_1447_gds_arrival_4",
        "seats": 5
      },
      {
        "blockId": "fb_1447_gds_arrival_1",
        "seats": 1
      },
      {
        "blockId": "fb_1447_gds_return_9",
        "seats": 1
      },
      {
        "blockId": "fb_1447_gds_arrival_6",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_return_6",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_arrival_16",
        "seats": 1
      },
      {
        "blockId": "fb_1447_gds_return_15",
        "seats": 1
      }
    ],
    "room_mix": {
      "2": 0,
      "3": 0,
      "4": 276
    },
    "publish_status": "approved",
    "sale_status": "unavailable",
    "content_ready_ar": true,
    "content_ready_en": true,
    "hero_approved": true
  },
  {
    "id": "pkg_1447_23",
    "package_no": "23",
    "name_en": "ITHRAA ALKHAIR 23",
    "tier": "standard",
    "variant_suffix": "",
    "capacity": 308,
    "initial_price_sar": 22033.12,
    "legs": [
      {
        "id": "leg_1447_23_0",
        "role": "first",
        "hotelId": "h_durrat",
        "starts_on": "2027-05-24",
        "ends_on": "2027-05-27"
      },
      {
        "id": "leg_1447_23_1",
        "role": "second",
        "hotelId": "h_aziziyah",
        "starts_on": "2027-05-27",
        "ends_on": "2027-06-08"
      }
    ],
    "contractIds": [
      "hc_1447_6",
      "hc_1447_12"
    ],
    "flightAllocations": [
      {
        "blockId": "fb_1447_17",
        "seats": 106
      },
      {
        "blockId": "fb_1447_0",
        "seats": 130
      },
      {
        "blockId": "fb_1447_42",
        "seats": 77
      },
      {
        "blockId": "fb_1447_5",
        "seats": 53
      },
      {
        "blockId": "fb_1447_gds_arrival_2",
        "seats": 20
      },
      {
        "blockId": "fb_1447_gds_return_1",
        "seats": 19
      },
      {
        "blockId": "fb_1447_110",
        "seats": 10
      },
      {
        "blockId": "fb_1447_111",
        "seats": 10
      },
      {
        "blockId": "fb_1447_gds_arrival_6",
        "seats": 13
      },
      {
        "blockId": "fb_1447_gds_return_6",
        "seats": 12
      },
      {
        "blockId": "fb_1447_gds_arrival_5",
        "seats": 13
      },
      {
        "blockId": "fb_1447_gds_return_7",
        "seats": 13
      },
      {
        "blockId": "fb_1447_gds_arrival_7",
        "seats": 17
      },
      {
        "blockId": "fb_1447_gds_return_3",
        "seats": 17
      },
      {
        "blockId": "fb_1447_gds_arrival_0",
        "seats": 11
      },
      {
        "blockId": "fb_1447_gds_return_0",
        "seats": 11
      },
      {
        "blockId": "fb_1447_gds_arrival_3",
        "seats": 7
      },
      {
        "blockId": "fb_1447_gds_return_4",
        "seats": 7
      },
      {
        "blockId": "fb_1447_gds_arrival_14",
        "seats": 5
      },
      {
        "blockId": "fb_1447_gds_return_14",
        "seats": 5
      },
      {
        "blockId": "fb_1447_gds_return_13",
        "seats": 1
      },
      {
        "blockId": "fb_1447_gds_arrival_10",
        "seats": 3
      },
      {
        "blockId": "fb_1447_gds_return_10",
        "seats": 4
      },
      {
        "blockId": "fb_1447_gds_arrival_4",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_return_8",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_arrival_1",
        "seats": 1
      },
      {
        "blockId": "fb_1447_gds_return_9",
        "seats": 1
      },
      {
        "blockId": "fb_1447_gds_arrival_12",
        "seats": 1
      },
      {
        "blockId": "fb_1447_gds_return_11",
        "seats": 1
      },
      {
        "blockId": "fb_1447_gds_arrival_8",
        "seats": 15
      },
      {
        "blockId": "fb_1447_gds_return_5",
        "seats": 15
      }
    ],
    "room_mix": {
      "2": 0,
      "3": 0,
      "4": 308
    },
    "publish_status": "approved",
    "sale_status": "unavailable",
    "content_ready_ar": true,
    "content_ready_en": true,
    "hero_approved": true
  },
  {
    "id": "pkg_1447_24",
    "package_no": "24",
    "name_en": "ITHRAA ALKHAIR 24",
    "tier": "standard",
    "variant_suffix": "",
    "capacity": 264,
    "initial_price_sar": 22194.76,
    "legs": [
      {
        "id": "leg_1447_24_0",
        "role": "first",
        "hotelId": "h_durrat",
        "starts_on": "2027-05-27",
        "ends_on": "2027-05-30"
      },
      {
        "id": "leg_1447_24_1",
        "role": "second",
        "hotelId": "h_aziziyah",
        "starts_on": "2027-05-30",
        "ends_on": "2027-06-12"
      }
    ],
    "contractIds": [
      "hc_1447_6",
      "hc_1447_12"
    ],
    "flightAllocations": [
      {
        "blockId": "fb_1447_91",
        "seats": 29
      },
      {
        "blockId": "fb_1447_92",
        "seats": 29
      },
      {
        "blockId": "fb_1447_95",
        "seats": 16
      },
      {
        "blockId": "fb_1447_14",
        "seats": 16
      },
      {
        "blockId": "fb_1447_70",
        "seats": 47
      },
      {
        "blockId": "fb_1447_71",
        "seats": 47
      },
      {
        "blockId": "fb_1447_73",
        "seats": 46
      },
      {
        "blockId": "fb_1447_74",
        "seats": 46
      },
      {
        "blockId": "fb_1447_gds_arrival_4",
        "seats": 1
      },
      {
        "blockId": "fb_1447_gds_return_8",
        "seats": 1
      },
      {
        "blockId": "fb_1447_gds_arrival_5",
        "seats": 17
      },
      {
        "blockId": "fb_1447_gds_return_7",
        "seats": 17
      },
      {
        "blockId": "fb_1447_gds_arrival_15",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_return_0",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_arrival_2",
        "seats": 52
      },
      {
        "blockId": "fb_1447_gds_return_1",
        "seats": 52
      },
      {
        "blockId": "fb_1447_gds_arrival_6",
        "seats": 16
      },
      {
        "blockId": "fb_1447_gds_return_6",
        "seats": 16
      },
      {
        "blockId": "fb_1447_112",
        "seats": 9
      },
      {
        "blockId": "fb_1447_113",
        "seats": 9
      },
      {
        "blockId": "fb_1447_gds_arrival_9",
        "seats": 19
      },
      {
        "blockId": "fb_1447_gds_return_2",
        "seats": 19
      },
      {
        "blockId": "fb_1447_gds_arrival_7",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_return_3",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_arrival_14",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_return_14",
        "seats": 2
      }
    ],
    "room_mix": {
      "2": 0,
      "3": 0,
      "4": 264
    },
    "publish_status": "approved",
    "sale_status": "unavailable",
    "content_ready_ar": true,
    "content_ready_en": true,
    "hero_approved": true
  },
  {
    "id": "pkg_1447_25",
    "package_no": "25",
    "name_en": "ITHRAA ALKHAIR 25",
    "tier": "standard",
    "variant_suffix": "",
    "capacity": 88,
    "initial_price_sar": 22200.96,
    "legs": [
      {
        "id": "leg_1447_25_0",
        "role": "first",
        "hotelId": "h_aziziyah",
        "starts_on": "2027-05-29",
        "ends_on": "2027-06-08"
      },
      {
        "id": "leg_1447_25_1",
        "role": "second",
        "hotelId": "h_deyar",
        "starts_on": "2027-06-08",
        "ends_on": "2027-06-12"
      }
    ],
    "contractIds": [
      "hc_1447_5",
      "hc_1447_12"
    ],
    "flightAllocations": [
      {
        "blockId": "fb_1447_82",
        "seats": 43
      },
      {
        "blockId": "fb_1447_31",
        "seats": 43
      },
      {
        "blockId": "fb_1447_gds_arrival_4",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_return_8",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_arrival_5",
        "seats": 1
      },
      {
        "blockId": "fb_1447_gds_return_7",
        "seats": 1
      },
      {
        "blockId": "fb_1447_gds_arrival_2",
        "seats": 13
      },
      {
        "blockId": "fb_1447_gds_return_1",
        "seats": 13
      },
      {
        "blockId": "fb_1447_13",
        "seats": 25
      },
      {
        "blockId": "fb_1447_2",
        "seats": 25
      },
      {
        "blockId": "fb_1447_gds_arrival_6",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_return_6",
        "seats": 2
      }
    ],
    "room_mix": {
      "2": 0,
      "3": 0,
      "4": 88
    },
    "publish_status": "approved",
    "sale_status": "unavailable",
    "content_ready_ar": true,
    "content_ready_en": true,
    "hero_approved": true
  },
  {
    "id": "pkg_1447_26",
    "package_no": "26",
    "name_en": "ITHRAA ALKHAIR 26",
    "tier": "standard",
    "variant_suffix": "",
    "capacity": 176,
    "initial_price_sar": 23170.91,
    "legs": [
      {
        "id": "leg_1447_26_0",
        "role": "first",
        "hotelId": "h_aziziyah",
        "starts_on": "2027-05-23",
        "ends_on": "2027-06-08"
      },
      {
        "id": "leg_1447_26_1",
        "role": "second",
        "hotelId": "h_deyar",
        "starts_on": "2027-06-08",
        "ends_on": "2027-06-12"
      }
    ],
    "contractIds": [
      "hc_1447_5",
      "hc_1447_12"
    ],
    "flightAllocations": [
      {
        "blockId": "fb_1447_15",
        "seats": 107
      },
      {
        "blockId": "fb_1447_16",
        "seats": 107
      },
      {
        "blockId": "fb_1447_gds_arrival_2",
        "seats": 11
      },
      {
        "blockId": "fb_1447_gds_return_1",
        "seats": 46
      },
      {
        "blockId": "fb_1447_114",
        "seats": 6
      },
      {
        "blockId": "fb_1447_115",
        "seats": 6
      },
      {
        "blockId": "fb_1447_gds_arrival_6",
        "seats": 3
      },
      {
        "blockId": "fb_1447_gds_return_6",
        "seats": 3
      },
      {
        "blockId": "fb_1447_gds_arrival_7",
        "seats": 1
      },
      {
        "blockId": "fb_1447_gds_return_3",
        "seats": 1
      },
      {
        "blockId": "fb_1447_gds_arrival_20",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_return_19",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_arrival_3",
        "seats": 35
      },
      {
        "blockId": "fb_1447_gds_arrival_14",
        "seats": 4
      },
      {
        "blockId": "fb_1447_gds_return_14",
        "seats": 4
      },
      {
        "blockId": "fb_1447_gds_arrival_5",
        "seats": 1
      },
      {
        "blockId": "fb_1447_gds_return_7",
        "seats": 1
      },
      {
        "blockId": "fb_1447_gds_arrival_0",
        "seats": 1
      },
      {
        "blockId": "fb_1447_gds_return_0",
        "seats": 1
      },
      {
        "blockId": "fb_1447_gds_arrival_4",
        "seats": 1
      },
      {
        "blockId": "fb_1447_gds_return_5",
        "seats": 1
      }
    ],
    "room_mix": {
      "2": 0,
      "3": 0,
      "4": 176
    },
    "publish_status": "approved",
    "sale_status": "unavailable",
    "content_ready_ar": true,
    "content_ready_en": true,
    "hero_approved": true
  },
  {
    "id": "pkg_1447_27",
    "package_no": "27",
    "name_en": "ITHRAA ALKHAIR 27",
    "tier": "standard",
    "variant_suffix": "",
    "capacity": 88,
    "initial_price_sar": 22362.61,
    "legs": [
      {
        "id": "leg_1447_27_0",
        "role": "first",
        "hotelId": "h_aziziyah",
        "starts_on": "2027-05-28",
        "ends_on": "2027-06-08"
      },
      {
        "id": "leg_1447_27_1",
        "role": "second",
        "hotelId": "h_deyar",
        "starts_on": "2027-06-08",
        "ends_on": "2027-06-12"
      }
    ],
    "contractIds": [
      "hc_1447_5",
      "hc_1447_12"
    ],
    "flightAllocations": [
      {
        "blockId": "fb_1447_gds_arrival_2",
        "seats": 7
      },
      {
        "blockId": "fb_1447_gds_return_1",
        "seats": 7
      },
      {
        "blockId": "fb_1447_24",
        "seats": 36
      },
      {
        "blockId": "fb_1447_14",
        "seats": 36
      },
      {
        "blockId": "fb_1447_gds_arrival_0",
        "seats": 3
      },
      {
        "blockId": "fb_1447_gds_return_0",
        "seats": 3
      },
      {
        "blockId": "fb_1447_gds_arrival_6",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_return_6",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_arrival_9",
        "seats": 1
      },
      {
        "blockId": "fb_1447_gds_return_2",
        "seats": 1
      },
      {
        "blockId": "fb_1447_gds_arrival_5",
        "seats": 5
      },
      {
        "blockId": "fb_1447_gds_return_7",
        "seats": 5
      },
      {
        "blockId": "fb_1447_gds_arrival_7",
        "seats": 7
      },
      {
        "blockId": "fb_1447_gds_return_3",
        "seats": 7
      },
      {
        "blockId": "fb_1447_gds_arrival_3",
        "seats": 10
      },
      {
        "blockId": "fb_1447_gds_return_4",
        "seats": 10
      },
      {
        "blockId": "fb_1447_gds_arrival_8",
        "seats": 13
      },
      {
        "blockId": "fb_1447_gds_return_5",
        "seats": 13
      },
      {
        "blockId": "fb_1447_gds_arrival_1",
        "seats": 1
      },
      {
        "blockId": "fb_1447_gds_return_9",
        "seats": 1
      },
      {
        "blockId": "fb_1447_gds_arrival_13",
        "seats": 1
      },
      {
        "blockId": "fb_1447_gds_return_12",
        "seats": 1
      }
    ],
    "room_mix": {
      "2": 0,
      "3": 0,
      "4": 88
    },
    "publish_status": "approved",
    "sale_status": "unavailable",
    "content_ready_ar": true,
    "content_ready_en": true,
    "hero_approved": true
  },
  {
    "id": "pkg_1447_28",
    "package_no": "28",
    "name_en": "ITHRAA ALKHAIR 28",
    "tier": "standard",
    "variant_suffix": "",
    "capacity": 352,
    "initial_price_sar": 22847.61,
    "legs": [
      {
        "id": "leg_1447_28_0",
        "role": "first",
        "hotelId": "h_aziziyah",
        "starts_on": "2027-05-29",
        "ends_on": "2027-06-12"
      },
      {
        "id": "leg_1447_28_1",
        "role": "second",
        "hotelId": "h_deyar",
        "starts_on": "2027-06-12",
        "ends_on": "2027-06-16"
      }
    ],
    "contractIds": [
      "hc_1447_5",
      "hc_1447_12"
    ],
    "flightAllocations": [
      {
        "blockId": "fb_1447_gds_arrival_5",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_return_7",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_arrival_2",
        "seats": 126
      },
      {
        "blockId": "fb_1447_gds_return_1",
        "seats": 147
      },
      {
        "blockId": "fb_1447_gds_arrival_10",
        "seats": 9
      },
      {
        "blockId": "fb_1447_gds_return_10",
        "seats": 9
      },
      {
        "blockId": "fb_1447_gds_arrival_11",
        "seats": 1
      },
      {
        "blockId": "fb_1447_gds_return_13",
        "seats": 1
      },
      {
        "blockId": "fb_1447_gds_arrival_8",
        "seats": 41
      },
      {
        "blockId": "fb_1447_gds_return_15",
        "seats": 4
      },
      {
        "blockId": "fb_1447_gds_return_5",
        "seats": 39
      },
      {
        "blockId": "fb_1447_gds_arrival_3",
        "seats": 95
      },
      {
        "blockId": "fb_1447_gds_return_4",
        "seats": 95
      },
      {
        "blockId": "fb_1447_gds_arrival_1",
        "seats": 21
      },
      {
        "blockId": "fb_1447_gds_arrival_0",
        "seats": 33
      },
      {
        "blockId": "fb_1447_gds_return_0",
        "seats": 33
      },
      {
        "blockId": "fb_1447_gds_arrival_6",
        "seats": 5
      },
      {
        "blockId": "fb_1447_gds_return_6",
        "seats": 5
      },
      {
        "blockId": "fb_1447_gds_arrival_7",
        "seats": 5
      },
      {
        "blockId": "fb_1447_gds_return_3",
        "seats": 5
      },
      {
        "blockId": "fb_1447_gds_arrival_13",
        "seats": 3
      },
      {
        "blockId": "fb_1447_gds_return_12",
        "seats": 3
      },
      {
        "blockId": "fb_1447_gds_arrival_16",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_arrival_25",
        "seats": 1
      },
      {
        "blockId": "fb_1447_gds_return_22",
        "seats": 1
      }
    ],
    "room_mix": {
      "2": 0,
      "3": 0,
      "4": 352
    },
    "publish_status": "approved",
    "sale_status": "unavailable",
    "content_ready_ar": true,
    "content_ready_en": true,
    "hero_approved": true
  },
  {
    "id": "pkg_1447_29",
    "package_no": "29",
    "name_en": "ITHRAA ALKHAIR 29",
    "tier": "luxury",
    "variant_suffix": "",
    "capacity": 110,
    "initial_price_sar": 29389.41,
    "legs": [
      {
        "id": "leg_1447_29_0",
        "role": "first",
        "hotelId": "h_hilton",
        "starts_on": "2027-05-12",
        "ends_on": "2027-05-20"
      },
      {
        "id": "leg_1447_29_1",
        "role": "second",
        "hotelId": "h_hyatt",
        "starts_on": "2027-05-20",
        "ends_on": "2027-05-29"
      },
      {
        "id": "leg_1447_29_2",
        "role": "transitional",
        "hotelId": "h_aziziyah",
        "starts_on": "2027-05-29",
        "ends_on": "2027-06-12"
      }
    ],
    "contractIds": [
      "hc_1447_12",
      "hc_1447_18",
      "hc_1447_23"
    ],
    "flightAllocations": [
      {
        "blockId": "fb_1447_gds_arrival_2",
        "seats": 41
      },
      {
        "blockId": "fb_1447_gds_return_1",
        "seats": 37
      },
      {
        "blockId": "fb_1447_gds_arrival_3",
        "seats": 3
      },
      {
        "blockId": "fb_1447_gds_return_4",
        "seats": 3
      },
      {
        "blockId": "fb_1447_gds_arrival_6",
        "seats": 13
      },
      {
        "blockId": "fb_1447_gds_return_6",
        "seats": 17
      },
      {
        "blockId": "fb_1447_gds_arrival_5",
        "seats": 20
      },
      {
        "blockId": "fb_1447_gds_return_7",
        "seats": 20
      },
      {
        "blockId": "fb_1447_gds_arrival_0",
        "seats": 4
      },
      {
        "blockId": "fb_1447_gds_return_0",
        "seats": 4
      },
      {
        "blockId": "fb_1447_gds_arrival_12",
        "seats": 5
      },
      {
        "blockId": "fb_1447_gds_return_11",
        "seats": 5
      },
      {
        "blockId": "fb_1447_gds_arrival_1",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_return_9",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_arrival_14",
        "seats": 7
      },
      {
        "blockId": "fb_1447_gds_return_14",
        "seats": 7
      },
      {
        "blockId": "fb_1447_gds_arrival_7",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_return_3",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_arrival_11",
        "seats": 7
      },
      {
        "blockId": "fb_1447_gds_return_13",
        "seats": 7
      },
      {
        "blockId": "fb_1447_gds_arrival_9",
        "seats": 1
      },
      {
        "blockId": "fb_1447_gds_return_2",
        "seats": 1
      }
    ],
    "room_mix": {
      "2": 41,
      "3": 25,
      "4": 44
    },
    "publish_status": "approved",
    "sale_status": "unavailable",
    "content_ready_ar": true,
    "content_ready_en": true,
    "hero_approved": true
  },
  {
    "id": "pkg_1447_30",
    "package_no": "30",
    "name_en": "ITHRAA ALKHAIR 30",
    "tier": "premium",
    "variant_suffix": "SA",
    "capacity": 100,
    "initial_price_sar": 30712.34,
    "legs": [
      {
        "id": "leg_1447_30_0",
        "role": "first",
        "hotelId": "h_taqwa",
        "starts_on": "2027-05-12",
        "ends_on": "2027-05-20"
      },
      {
        "id": "leg_1447_30_1",
        "role": "second",
        "hotelId": "h_hyatt",
        "starts_on": "2027-05-20",
        "ends_on": "2027-05-29"
      },
      {
        "id": "leg_1447_30_2",
        "role": "transitional",
        "hotelId": "h_aziziyah",
        "starts_on": "2027-05-29",
        "ends_on": "2027-06-12"
      }
    ],
    "contractIds": [
      "hc_1447_12",
      "hc_1447_22",
      "hc_1447_29"
    ],
    "flightAllocations": [
      {
        "blockId": "fb_1447_18",
        "seats": 97
      },
      {
        "blockId": "fb_1447_45",
        "seats": 73
      },
      {
        "blockId": "fb_1447_44",
        "seats": 24
      }
    ],
    "room_mix": {
      "2": 80,
      "3": 16,
      "4": 4
    },
    "publish_status": "approved",
    "sale_status": "unavailable",
    "content_ready_ar": true,
    "content_ready_en": true,
    "hero_approved": true
  },
  {
    "id": "pkg_1447_31",
    "package_no": "31",
    "name_en": "ITHRAA ALKHAIR 31",
    "tier": "luxury",
    "variant_suffix": "SA",
    "capacity": 52,
    "initial_price_sar": 30021.66,
    "legs": [
      {
        "id": "leg_1447_31_0",
        "role": "first",
        "hotelId": "h_hilton",
        "starts_on": "2027-05-15",
        "ends_on": "2027-05-20"
      },
      {
        "id": "leg_1447_31_1",
        "role": "second",
        "hotelId": "h_hyatt",
        "starts_on": "2027-05-20",
        "ends_on": "2027-05-29"
      },
      {
        "id": "leg_1447_31_2",
        "role": "transitional",
        "hotelId": "h_aziziyah",
        "starts_on": "2027-05-29",
        "ends_on": "2027-06-12"
      }
    ],
    "contractIds": [
      "hc_1447_12",
      "hc_1447_21",
      "hc_1447_22"
    ],
    "flightAllocations": [
      {
        "blockId": "fb_1447_58",
        "seats": 50
      },
      {
        "blockId": "fb_1447_44",
        "seats": 50
      }
    ],
    "room_mix": {
      "2": 44,
      "3": 6,
      "4": 2
    },
    "publish_status": "approved",
    "sale_status": "unavailable",
    "content_ready_ar": true,
    "content_ready_en": true,
    "hero_approved": true
  },
  {
    "id": "pkg_1447_32",
    "package_no": "32",
    "name_en": "ITHRAA ALKHAIR 32",
    "tier": "standard",
    "variant_suffix": "",
    "capacity": 76,
    "initial_price_sar": 26913.19,
    "legs": [
      {
        "id": "leg_1447_32_0",
        "role": "first",
        "hotelId": "h_durrat",
        "starts_on": "2027-05-20",
        "ends_on": "2027-05-24"
      },
      {
        "id": "leg_1447_32_1",
        "role": "second",
        "hotelId": "h_aziziyah",
        "starts_on": "2027-05-24",
        "ends_on": "2027-06-10"
      }
    ],
    "contractIds": [
      "hc_1447_6",
      "hc_1447_25"
    ],
    "flightAllocations": [
      {
        "blockId": "fb_1447_7",
        "seats": 67
      },
      {
        "blockId": "fb_1447_8",
        "seats": 67
      },
      {
        "blockId": "fb_1447_gds_arrival_2",
        "seats": 4
      },
      {
        "blockId": "fb_1447_gds_return_1",
        "seats": 4
      },
      {
        "blockId": "fb_1447_gds_arrival_7",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_return_3",
        "seats": 2
      }
    ],
    "room_mix": {
      "2": 0,
      "3": 0,
      "4": 76
    },
    "publish_status": "approved",
    "sale_status": "unavailable",
    "content_ready_ar": true,
    "content_ready_en": true,
    "hero_approved": true
  },
  {
    "id": "pkg_1447_33",
    "package_no": "33",
    "name_en": "ITHRAA ALKHAIR 33",
    "tier": "luxury",
    "variant_suffix": "",
    "capacity": 250,
    "initial_price_sar": 44128.07,
    "legs": [
      {
        "id": "leg_1447_33_0",
        "role": "first",
        "hotelId": "h_swiss",
        "starts_on": "2027-05-29",
        "ends_on": "2027-06-08"
      },
      {
        "id": "leg_1447_33_1",
        "role": "second",
        "hotelId": "h_haram",
        "starts_on": "2027-06-08",
        "ends_on": "2027-06-12"
      }
    ],
    "contractIds": [
      "hc_1447_18",
      "hc_1447_24"
    ],
    "flightAllocations": [
      {
        "blockId": "fb_1447_77",
        "seats": 45
      },
      {
        "blockId": "fb_1447_78",
        "seats": 45
      },
      {
        "blockId": "fb_1447_gds_arrival_5",
        "seats": 6
      },
      {
        "blockId": "fb_1447_gds_return_7",
        "seats": 6
      },
      {
        "blockId": "fb_1447_101",
        "seats": 15
      },
      {
        "blockId": "fb_1447_102",
        "seats": 15
      },
      {
        "blockId": "fb_1447_gds_arrival_2",
        "seats": 45
      },
      {
        "blockId": "fb_1447_gds_return_1",
        "seats": 47
      },
      {
        "blockId": "fb_1447_48",
        "seats": 21
      },
      {
        "blockId": "fb_1447_49",
        "seats": 21
      },
      {
        "blockId": "fb_1447_gds_arrival_4",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_return_8",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_arrival_7",
        "seats": 12
      },
      {
        "blockId": "fb_1447_gds_return_3",
        "seats": 12
      },
      {
        "blockId": "fb_1447_107",
        "seats": 14
      },
      {
        "blockId": "fb_1447_108",
        "seats": 14
      },
      {
        "blockId": "fb_1447_gds_arrival_16",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_return_15",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_arrival_12",
        "seats": 3
      },
      {
        "blockId": "fb_1447_gds_return_11",
        "seats": 3
      },
      {
        "blockId": "fb_1447_gds_arrival_6",
        "seats": 6
      },
      {
        "blockId": "fb_1447_gds_arrival_13",
        "seats": 3
      },
      {
        "blockId": "fb_1447_gds_return_12",
        "seats": 3
      },
      {
        "blockId": "fb_1447_gds_arrival_3",
        "seats": 8
      },
      {
        "blockId": "fb_1447_gds_return_4",
        "seats": 8
      },
      {
        "blockId": "fb_1447_gds_return_6",
        "seats": 4
      },
      {
        "blockId": "fb_1447_gds_arrival_11",
        "seats": 1
      },
      {
        "blockId": "fb_1447_gds_return_13",
        "seats": 1
      }
    ],
    "room_mix": {
      "2": 50,
      "3": 72,
      "4": 128
    },
    "publish_status": "approved",
    "sale_status": "unavailable",
    "content_ready_ar": false,
    "content_ready_en": false,
    "hero_approved": false
  },
  {
    "id": "pkg_1447_34",
    "package_no": "34",
    "name_en": "ITHRAA ALKHAIR 34",
    "tier": "standard",
    "variant_suffix": "",
    "capacity": 140,
    "initial_price_sar": 22266.63,
    "legs": [
      {
        "id": "leg_1447_34_0",
        "role": "first",
        "hotelId": "h_aziziyah",
        "starts_on": "2027-05-29",
        "ends_on": "2027-06-08"
      },
      {
        "id": "leg_1447_34_1",
        "role": "second",
        "hotelId": "h_maysan",
        "starts_on": "2027-06-08",
        "ends_on": "2027-06-12"
      }
    ],
    "contractIds": [
      "hc_1447_11",
      "hc_1447_12"
    ],
    "flightAllocations": [
      {
        "blockId": "fb_1447_gds_arrival_2",
        "seats": 35
      },
      {
        "blockId": "fb_1447_gds_return_1",
        "seats": 44
      },
      {
        "blockId": "fb_1447_gds_arrival_6",
        "seats": 1
      },
      {
        "blockId": "fb_1447_gds_return_6",
        "seats": 1
      },
      {
        "blockId": "fb_1447_gds_arrival_4",
        "seats": 3
      },
      {
        "blockId": "fb_1447_gds_arrival_5",
        "seats": 7
      },
      {
        "blockId": "fb_1447_gds_return_7",
        "seats": 7
      },
      {
        "blockId": "fb_1447_gds_arrival_10",
        "seats": 5
      },
      {
        "blockId": "fb_1447_gds_return_16",
        "seats": 5
      },
      {
        "blockId": "fb_1447_gds_arrival_0",
        "seats": 11
      },
      {
        "blockId": "fb_1447_gds_return_0",
        "seats": 11
      },
      {
        "blockId": "fb_1447_gds_return_18",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_arrival_8",
        "seats": 47
      },
      {
        "blockId": "fb_1447_gds_return_5",
        "seats": 47
      },
      {
        "blockId": "fb_1447_gds_arrival_1",
        "seats": 8
      },
      {
        "blockId": "fb_1447_gds_arrival_3",
        "seats": 15
      },
      {
        "blockId": "fb_1447_gds_return_4",
        "seats": 15
      },
      {
        "blockId": "fb_1447_gds_arrival_13",
        "seats": 4
      },
      {
        "blockId": "fb_1447_gds_return_12",
        "seats": 4
      }
    ],
    "room_mix": {
      "2": 0,
      "3": 0,
      "4": 140
    },
    "publish_status": "approved",
    "sale_status": "unavailable",
    "content_ready_ar": false,
    "content_ready_en": false,
    "hero_approved": false
  },
  {
    "id": "pkg_1447_35",
    "package_no": "35",
    "name_en": "ITHRAA ALKHAIR 35",
    "tier": "standard",
    "variant_suffix": "",
    "capacity": 88,
    "initial_price_sar": 22194.76,
    "legs": [
      {
        "id": "leg_1447_35_0",
        "role": "first",
        "hotelId": "h_durrat",
        "starts_on": "2027-05-27",
        "ends_on": "2027-05-30"
      },
      {
        "id": "leg_1447_35_1",
        "role": "second",
        "hotelId": "h_aziziyah",
        "starts_on": "2027-05-30",
        "ends_on": "2027-06-12"
      }
    ],
    "contractIds": [
      "hc_1447_6",
      "hc_1447_12"
    ],
    "flightAllocations": [
      {
        "blockId": "fb_1447_gds_arrival_2",
        "seats": 17
      },
      {
        "blockId": "fb_1447_gds_return_1",
        "seats": 12
      },
      {
        "blockId": "fb_1447_gds_return_4",
        "seats": 19
      },
      {
        "blockId": "fb_1447_gds_arrival_4",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_return_8",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_arrival_7",
        "seats": 12
      },
      {
        "blockId": "fb_1447_gds_return_3",
        "seats": 12
      },
      {
        "blockId": "fb_1447_gds_arrival_5",
        "seats": 1
      },
      {
        "blockId": "fb_1447_gds_return_7",
        "seats": 3
      },
      {
        "blockId": "fb_1447_gds_arrival_21",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_return_11",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_arrival_6",
        "seats": 4
      },
      {
        "blockId": "fb_1447_gds_return_6",
        "seats": 4
      },
      {
        "blockId": "fb_1447_gds_arrival_8",
        "seats": 31
      },
      {
        "blockId": "fb_1447_gds_return_5",
        "seats": 31
      },
      {
        "blockId": "fb_1447_gds_arrival_3",
        "seats": 16
      }
    ],
    "room_mix": {
      "2": 0,
      "3": 0,
      "4": 88
    },
    "publish_status": "approved",
    "sale_status": "unavailable",
    "content_ready_ar": false,
    "content_ready_en": false,
    "hero_approved": false
  },
  {
    "id": "pkg_1447_36",
    "package_no": "36",
    "name_en": "ITHRAA ALKHAIR 36",
    "tier": "standard",
    "variant_suffix": "",
    "capacity": 124,
    "initial_price_sar": 21826.5,
    "legs": [
      {
        "id": "leg_1447_36_0",
        "role": "first",
        "hotelId": "h_aziziyah",
        "starts_on": "2027-05-29",
        "ends_on": "2027-06-12"
      },
      {
        "id": "leg_1447_36_1",
        "role": "second",
        "hotelId": "h_maysan",
        "starts_on": "2027-06-12",
        "ends_on": "2027-06-16"
      }
    ],
    "contractIds": [
      "hc_1447_0",
      "hc_1447_12"
    ],
    "flightAllocations": [
      {
        "blockId": "fb_1447_gds_arrival_2",
        "seats": 33
      },
      {
        "blockId": "fb_1447_gds_return_1",
        "seats": 40
      },
      {
        "blockId": "fb_1447_gds_arrival_4",
        "seats": 1
      },
      {
        "blockId": "fb_1447_gds_return_8",
        "seats": 1
      },
      {
        "blockId": "fb_1447_gds_arrival_20",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_return_19",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_arrival_6",
        "seats": 20
      },
      {
        "blockId": "fb_1447_gds_return_10",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_arrival_9",
        "seats": 1
      },
      {
        "blockId": "fb_1447_gds_return_2",
        "seats": 1
      },
      {
        "blockId": "fb_1447_gds_arrival_0",
        "seats": 33
      },
      {
        "blockId": "fb_1447_gds_return_0",
        "seats": 33
      },
      {
        "blockId": "fb_1447_gds_return_6",
        "seats": 20
      },
      {
        "blockId": "fb_1447_gds_arrival_8",
        "seats": 16
      },
      {
        "blockId": "fb_1447_gds_return_5",
        "seats": 14
      },
      {
        "blockId": "fb_1447_gds_arrival_1",
        "seats": 9
      },
      {
        "blockId": "fb_1447_gds_arrival_5",
        "seats": 3
      },
      {
        "blockId": "fb_1447_gds_return_7",
        "seats": 3
      },
      {
        "blockId": "fb_1447_gds_arrival_7",
        "seats": 3
      },
      {
        "blockId": "fb_1447_gds_return_3",
        "seats": 5
      }
    ],
    "room_mix": {
      "2": 0,
      "3": 0,
      "4": 124
    },
    "publish_status": "approved",
    "sale_status": "unavailable",
    "content_ready_ar": false,
    "content_ready_en": false,
    "hero_approved": false
  },
  {
    "id": "pkg_1447_37",
    "package_no": "37",
    "name_en": "ITHRAA ALKHAIR 37",
    "tier": "standard",
    "variant_suffix": "",
    "capacity": 44,
    "initial_price_sar": 22033.12,
    "legs": [
      {
        "id": "leg_1447_37_0",
        "role": "first",
        "hotelId": "h_durrat",
        "starts_on": "2027-05-24",
        "ends_on": "2027-05-27"
      },
      {
        "id": "leg_1447_37_1",
        "role": "second",
        "hotelId": "h_aziziyah",
        "starts_on": "2027-05-27",
        "ends_on": "2027-06-08"
      }
    ],
    "contractIds": [
      "hc_1447_6",
      "hc_1447_12"
    ],
    "flightAllocations": [
      {
        "blockId": "fb_1447_gds_arrival_5",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_return_7",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_arrival_7",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_return_3",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_arrival_12",
        "seats": 4
      },
      {
        "blockId": "fb_1447_gds_return_5",
        "seats": 25
      },
      {
        "blockId": "fb_1447_gds_arrival_2",
        "seats": 11
      },
      {
        "blockId": "fb_1447_gds_return_1",
        "seats": 11
      },
      {
        "blockId": "fb_1447_gds_arrival_8",
        "seats": 21
      },
      {
        "blockId": "fb_1447_gds_arrival_0",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_return_0",
        "seats": 2
      }
    ],
    "room_mix": {
      "2": 0,
      "3": 0,
      "4": 44
    },
    "publish_status": "approved",
    "sale_status": "unavailable",
    "content_ready_ar": false,
    "content_ready_en": false,
    "hero_approved": false
  },
  {
    "id": "pkg_1447_38",
    "package_no": "38",
    "name_en": "ITHRAA ALKHAIR 38",
    "tier": "premium",
    "variant_suffix": "SA",
    "capacity": 20,
    "initial_price_sar": 30712.34,
    "legs": [
      {
        "id": "leg_1447_38_0",
        "role": "first",
        "hotelId": "h_taqwa",
        "starts_on": "2027-05-12",
        "ends_on": "2027-05-20"
      },
      {
        "id": "leg_1447_38_1",
        "role": "second",
        "hotelId": "h_hyatt",
        "starts_on": "2027-05-20",
        "ends_on": "2027-05-29"
      },
      {
        "id": "leg_1447_38_2",
        "role": "transitional",
        "hotelId": "h_aziziyah",
        "starts_on": "2027-05-29",
        "ends_on": "2027-06-12"
      }
    ],
    "contractIds": [
      "hc_1447_12",
      "hc_1447_22",
      "hc_1447_29"
    ],
    "flightAllocations": [
      {
        "blockId": "fb_1447_gds_arrival_2",
        "seats": 5
      },
      {
        "blockId": "fb_1447_gds_return_1",
        "seats": 5
      },
      {
        "blockId": "fb_1447_gds_arrival_6",
        "seats": 5
      },
      {
        "blockId": "fb_1447_gds_return_6",
        "seats": 5
      },
      {
        "blockId": "fb_1447_gds_arrival_5",
        "seats": 6
      },
      {
        "blockId": "fb_1447_gds_return_7",
        "seats": 6
      },
      {
        "blockId": "fb_1447_gds_arrival_4",
        "seats": 2
      },
      {
        "blockId": "fb_1447_gds_return_8",
        "seats": 2
      }
    ],
    "room_mix": {
      "2": 9,
      "3": 0,
      "4": 11
    },
    "publish_status": "approved",
    "sale_status": "unavailable",
    "content_ready_ar": false,
    "content_ready_en": false,
    "hero_approved": false
  },
  {
    "id": "pkg_1447_39",
    "package_no": "39",
    "name_en": "ITHRAA ALKHAIR 39",
    "tier": "luxury",
    "variant_suffix": "SA",
    "capacity": 18,
    "initial_price_sar": 30021.66,
    "legs": [
      {
        "id": "leg_1447_39_0",
        "role": "first",
        "hotelId": "h_hilton",
        "starts_on": "2027-05-15",
        "ends_on": "2027-05-20"
      },
      {
        "id": "leg_1447_39_1",
        "role": "second",
        "hotelId": "h_hyatt",
        "starts_on": "2027-05-20",
        "ends_on": "2027-05-29"
      },
      {
        "id": "leg_1447_39_2",
        "role": "transitional",
        "hotelId": "h_aziziyah",
        "starts_on": "2027-05-29",
        "ends_on": "2027-06-12"
      }
    ],
    "contractIds": [
      "hc_1447_12",
      "hc_1447_21",
      "hc_1447_22"
    ],
    "flightAllocations": [
      {
        "blockId": "fb_1447_gds_arrival_6",
        "seats": 5
      },
      {
        "blockId": "fb_1447_gds_return_6",
        "seats": 5
      },
      {
        "blockId": "fb_1447_gds_arrival_2",
        "seats": 5
      },
      {
        "blockId": "fb_1447_gds_return_1",
        "seats": 5
      },
      {
        "blockId": "fb_1447_gds_arrival_5",
        "seats": 6
      },
      {
        "blockId": "fb_1447_gds_return_7",
        "seats": 6
      }
    ],
    "room_mix": {
      "2": 4,
      "3": 7,
      "4": 7
    },
    "publish_status": "approved",
    "sale_status": "unavailable",
    "content_ready_ar": false,
    "content_ready_en": false,
    "hero_approved": false
  }
]
