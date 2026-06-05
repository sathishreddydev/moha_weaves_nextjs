import { ProductWithDetails } from "@/shared";
import ProductSectionClient from "./ProductSectionClient";

interface ProductSectionProps {
  title: string;
  subtitle: string;
  endpoint: string;
  viewAllLink: string;
  initialProducts: ProductWithDetails[];
}


export default function ProductSection(props: ProductSectionProps) {
  return <ProductSectionClient {...props} />;
}
