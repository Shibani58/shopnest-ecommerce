import { CurrencyPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { errorMessage } from '../../core/api';
import { CartService } from '../../core/cart.service';
import { Cart, CartItem } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { ProductImage } from '../../shared/product-image';

@Component({
  selector: 'app-cart',
  imports: [RouterLink, CurrencyPipe, ProductImage],
  template: `
    <div class="container section">
      <h1>Your cart</h1>
      @if (cartService.cart(); as cart) {
        @if (cart.items.length) {
          <div class="layout">
            <div class="panel items">
              @for (item of cart.items; track item.productId) {
                <div class="item" [class.busy]="busyId() === item.productId">
                  <a class="thumb" [routerLink]="['/products', item.productId]">
                    <app-product-image [src]="item.imageUrl" [alt]="item.name" />
                  </a>
                  <div class="item-info">
                    <a [routerLink]="['/products', item.productId]" class="name">{{ item.name }}</a>
                    <span class="muted small">{{ item.unitPrice | currency: 'INR' }} each</span>
                    @if (item.quantity > item.stock) {
                      <span class="field-error">Only {{ item.stock }} left - please reduce the quantity.</span>
                    }
                    <div class="row">
                      <div class="stepper" role="group" [attr.aria-label]="'Quantity of ' + item.name">
                        <button type="button" (click)="change(item, -1)" [disabled]="item.quantity <= 1" aria-label="Decrease">−</button>
                        <span>{{ item.quantity }}</span>
                        <button type="button" (click)="change(item, 1)" [disabled]="item.quantity >= item.stock" aria-label="Increase">+</button>
                      </div>
                      <button type="button" class="link-btn small" (click)="remove(item)">Remove</button>
                    </div>
                  </div>
                  <strong class="line-total">{{ item.lineTotal | currency: 'INR' }}</strong>
                </div>
              }
            </div>

            <aside class="panel summary">
              <h2>Order summary</h2>
              <div class="sum-row"><span>Items ({{ cart.itemCount }})</span><span>{{ cart.subtotal | currency: 'INR' }}</span></div>
              <div class="sum-row">
                <span>Delivery</span>
                <span>{{ cart.shippingFee > 0 ? (cart.shippingFee | currency: 'INR') : 'FREE' }}</span>
              </div>
              @if (cart.shippingFee > 0) {
                <p class="small muted">Add {{ 999 - cart.subtotal | currency: 'INR' }} more for free delivery.</p>
              }
              <div class="sum-row total"><span>Total</span><span>{{ cart.total | currency: 'INR' }}</span></div>
              <a routerLink="/checkout" class="btn btn-primary btn-block">Proceed to checkout</a>
              <a routerLink="/products" class="btn btn-ghost btn-block">Continue shopping</a>
            </aside>
          </div>
        } @else {
          <div class="empty panel">
            <h2>Your cart is empty</h2>
            <p>Find something you love and it will show up here.</p>
            <a routerLink="/products" class="btn btn-primary">Browse products</a>
          </div>
        }
      } @else {
        <div class="spinner" aria-label="Loading"></div>
      }
    </div>
  `,
  styleUrl: './cart.css',
})
export class CartPage {
  protected readonly cartService = inject(CartService);
  private readonly toast = inject(ToastService);
  protected readonly busyId = signal<number | null>(null);

  constructor() {
    this.cartService.refresh();
  }

  change(item: CartItem, delta: number): void {
    this.run(item, this.cartService.setQuantity(item.productId, item.quantity + delta));
  }

  remove(item: CartItem): void {
    this.run(item, this.cartService.remove(item.productId));
  }

  private run(item: CartItem, request: Observable<Cart>): void {
    this.busyId.set(item.productId);
    request.subscribe({
      next: () => this.busyId.set(null),
      error: (err) => {
        this.busyId.set(null);
        this.toast.error(errorMessage(err));
      },
    });
  }
}
