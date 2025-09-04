import { Routes, Route } from "react-router-dom";
import { ProductCatalog } from "@/components/Ecommerce/ProductCatalog";
import { ProductDetails } from "@/components/Ecommerce/ProductDetails";
import { Cart } from "@/components/Ecommerce/Cart";
import { Checkout } from "@/components/Ecommerce/Checkout";
import { OrderSuccess } from "@/components/Ecommerce/OrderSuccess";
import { EcommerceLayout } from "@/components/Ecommerce/EcommerceLayout";

export function EcommercePage() {
  return (
    <EcommerceLayout>
      <Routes>
        <Route path="/" element={<ProductCatalog />} />
        <Route path="/produto/:id" element={<ProductDetails />} />
        <Route path="/carrinho" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/pedido/:id" element={<OrderSuccess />} />
      </Routes>
    </EcommerceLayout>
  );
}