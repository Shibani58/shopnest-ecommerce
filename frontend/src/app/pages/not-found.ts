import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `
    <div class="container empty">
      <h1>404</h1>
      <h2>We couldn't find that page</h2>
      <p>The link may be broken or the page may have moved.</p>
      <a routerLink="/" class="btn btn-primary">Go to the home page</a>
    </div>
  `,
})
export class NotFoundPage {}
