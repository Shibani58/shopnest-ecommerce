package com.shopnest.service;

import com.shopnest.dto.OrderDtos.CardDetails;
import com.shopnest.entity.PaymentMethod;
import com.shopnest.exception.BusinessException;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PaymentServiceTest {

    private final PaymentService payments = new PaymentService();
    private final BigDecimal amount = new BigDecimal("499.00");

    @Test
    void cashOnDeliveryNeedsNoCard() {
        assertThat(payments.charge(PaymentMethod.CASH_ON_DELIVERY, null, amount)).isEqualTo("COD");
    }

    @Test
    void validCardReturnsMaskedReference() {
        var card = new CardDetails("4242 4242 4242 4242", "12/40", "123");
        assertThat(payments.charge(PaymentMethod.CARD, card, amount)).isEqualTo("CARD-4242");
    }

    @Test
    void rejectsBadNumbersExpiredCardsAndTheDeclineCard() {
        assertThatThrownBy(() -> payments.charge(PaymentMethod.CARD,
                new CardDetails("4242 4242 4242 4241", "12/40", "123"), amount))
                .isInstanceOf(BusinessException.class).hasMessageContaining("not valid");
        assertThatThrownBy(() -> payments.charge(PaymentMethod.CARD,
                new CardDetails("4242 4242 4242 4242", "01/20", "123"), amount))
                .isInstanceOf(BusinessException.class).hasMessageContaining("expired");
        assertThatThrownBy(() -> payments.charge(PaymentMethod.CARD,
                new CardDetails("4000 0000 0000 0002", "12/40", "123"), amount))
                .isInstanceOf(BusinessException.class).hasMessageContaining("declined");
    }

    @Test
    void luhnCheck() {
        assertThat(PaymentService.passesLuhn("4242424242424242")).isTrue();
        assertThat(PaymentService.passesLuhn("5555555555554444")).isTrue();
        assertThat(PaymentService.passesLuhn("1234567812345678")).isFalse();
    }
}
