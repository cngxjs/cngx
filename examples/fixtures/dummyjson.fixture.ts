/** Subset of a DummyJSON product used in backend demos. */
export interface DJProduct {
  id: number;
  title: string;
  brand: string;
  price: number;
  rating: number;
  category: string;
}

/** DummyJSON product category entry. */
export interface DJCategory {
  slug: string;
  name: string;
}
