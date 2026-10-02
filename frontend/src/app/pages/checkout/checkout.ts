import { CurrencyPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { startWith } from 'rxjs';
import { errorMessage } from '../../core/api';
import { AuthService } from '../../core/auth.service';
import { CartService } from '../../core/cart.service';
import { CheckoutRequest, PaymentMethod } from '../../core/models';
import { OrderService } from '../../core/order.service';
import { ToastService } from '../../core/toast.service';

const ADDRESS_KEY = 'shopnest.lastAddress';

@Component({
  selector: 'app-checkout',
  imports: [ReactiveFormsModule, RouterLink, CurrencyPipe],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css',
})
export class CheckoutPage {
  private readonly fb = inject(FormBuilder);
  private readonly orders = inject(OrderService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly auth = inject(AuthService);
  protected readonly cartService = inject(CartService);

  protected readonly address = this.fb.nonNullable.group({
    recipientName: [this.auth.user()?.fullName ?? '', [Validators.required, Validators.maxLength(80)]],
    phone: ['', [Validators.required, Validators.pattern(/^[0-9+\- ]{7,20}$/)]],
    line1: ['', [Validators.required, Validators.maxLength(150)]],
    line2: [''],
    city: ['', Validators.required],
    state: ['', Validators.required],
    postalCode: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9 \-]{3,12}$/)]],
    country: ['India', Validators.required],
  });

  protected readonly payment = this.fb.nonNullable.group({
    method: ['CARD' as PaymentMethod],
    number: [''],
    expiry: [''],
    cvv: [''],
  });

  protected readonly method = toSignal(
    this.payment.controls.method.valueChanges.pipe(startWith(this.payment.controls.method.value)),
    { requireSync: true },
  );
  protected readonly placing = signal(false);
  protected readonly error = signal<string | null>(null);

  constructor() {
    this.cartService.refresh();
    try {
      const saved = localStorage.getItem(ADDRESS_KEY);
      if (saved) {
        this.address.patchValue(JSON.parse(saved));
      }
    } catch {
      // A missing or corrupt saved address is not a problem; the form just starts empty.
    }
  }

  useTestCard(): void {
    this.payment.patchValue({ number: '4242 4242 4242 4242', expiry: '12/30', cvv: '123' });
  }

  formatCardNumber(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 19);
    this.payment.controls.number.setValue(digits.replace(/(.{4})/g, '$1 ').trim());
  }

  formatExpiry(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 4);
    this.payment.controls.expiry.setValue(digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits);
  }

  placeOrder(): void {
    if (this.address.invalid) {
      this.address.markAllAsTouched();
      this.error.set('Please complete your delivery address.');
      return;
    }
    const pay = this.payment.getRawValue();
    if (pay.method === 'CARD' && !(pay.number && pay.expiry && pay.cvv)) {
      this.error.set('Please enter your card details, or choose cash on delivery.');
      return;
    }

    const shippingAddress = this.address.getRawValue();
    const request: CheckoutRequest = {
      shippingAddress: { ...shippingAddress, line2: shippingAddress.line2 || null },
      paymentMethod: pay.method,
      card: pay.method === 'CARD' ? { number: pay.number, expiry: pay.expiry, cvv: pay.cvv } : null,
    };

    this.placing.set(true);
    this.error.set(null);
    this.orders.checkout(request).subscribe({
      next: (order) => {
        try {
          localStorage.setItem(ADDRESS_KEY, JSON.stringify(shippingAddress));
        } catch {
          // Remembering the address is only a convenience.
        }
        this.cartService.refresh();
        this.toast.success(`Order #${order.id} placed!`);
        this.router.navigate(['/orders', order.id], { queryParams: { placed: 1 } });
      },
      error: (err) => {
        this.placing.set(false);
        this.error.set(errorMessage(err));
        this.cartService.refresh();
      },
    });
  }

  invalid(name: 'phone' | 'postalCode'): boolean {
    const control = this.address.controls[name];
    return control.touched && control.invalid;
  }
}
