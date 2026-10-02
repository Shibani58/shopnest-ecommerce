import { Routes } from '@angular/router';
import { adminGuard, authGuard, guestGuard } from './core/guards';

// Pages are lazy-loaded so the first visit only downloads the shop front.
export const routes: Routes = [
  { path: '', title: 'ShopNest', loadComponent: () => import('./pages/home/home').then((m) => m.HomePage) },
  {
    path: 'products',
    title: 'Shop | ShopNest',
    loadComponent: () => import('./pages/product-list/product-list').then((m) => m.ProductListPage),
  },
  {
    path: 'products/:id',
    title: 'Product | ShopNest',
    loadComponent: () => import('./pages/product-detail/product-detail').then((m) => m.ProductDetailPage),
  },
  {
    path: 'login',
    title: 'Log in | ShopNest',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/auth/login').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    title: 'Create account | ShopNest',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/auth/register').then((m) => m.RegisterPage),
  },
  {
    path: 'cart',
    title: 'Cart | ShopNest',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/cart/cart').then((m) => m.CartPage),
  },
  {
    path: 'checkout',
    title: 'Checkout | ShopNest',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/checkout/checkout').then((m) => m.CheckoutPage),
  },
  {
    path: 'orders',
    title: 'My orders | ShopNest',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/orders/order-list').then((m) => m.OrderListPage),
  },
  {
    path: 'orders/:id',
    title: 'Order | ShopNest',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/orders/order-detail').then((m) => m.OrderDetailPage),
  },
  {
    path: 'wishlist',
    title: 'Wishlist | ShopNest',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/wishlist/wishlist').then((m) => m.WishlistPage),
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./pages/admin/admin-layout').then((m) => m.AdminLayout),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        title: 'Dashboard | ShopNest Admin',
        loadComponent: () => import('./pages/admin/dashboard').then((m) => m.AdminDashboardPage),
      },
      {
        path: 'products',
        title: 'Products | ShopNest Admin',
        loadComponent: () => import('./pages/admin/products').then((m) => m.AdminProductsPage),
      },
      {
        path: 'products/new',
        title: 'New product | ShopNest Admin',
        loadComponent: () => import('./pages/admin/product-form').then((m) => m.AdminProductFormPage),
      },
      {
        path: 'products/:id',
        title: 'Edit product | ShopNest Admin',
        loadComponent: () => import('./pages/admin/product-form').then((m) => m.AdminProductFormPage),
      },
      {
        path: 'categories',
        title: 'Categories | ShopNest Admin',
        loadComponent: () => import('./pages/admin/categories').then((m) => m.AdminCategoriesPage),
      },
      {
        path: 'orders',
        title: 'Orders | ShopNest Admin',
        loadComponent: () => import('./pages/admin/orders').then((m) => m.AdminOrdersPage),
      },
    ],
  },
  {
    path: '**',
    title: 'Not found | ShopNest',
    loadComponent: () => import('./pages/not-found').then((m) => m.NotFoundPage),
  },
];
