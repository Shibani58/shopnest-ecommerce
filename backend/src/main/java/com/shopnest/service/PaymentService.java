package com.shopnest.service;

import com.shopnest.dto.OrderDtos.CardDetails;
import com.shopnest.entity.PaymentMethod;
import com.shopnest.exception.BusinessException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.YearMonth;

/**
 * A stand-in for a real payment gateway so the whole checkout can be demoed without keys.
 * Card numbers are checked (Luhn + expiry) and never stored. A card ending in 0002 is always
 * declined, mirroring how real gateways publish test cards for failure paths.
 */
@Service
public class PaymentService {

    public String charge(PaymentMethod method, CardDetails card, BigDecimal amount) {
        if (method == PaymentMethod.CASH_ON_DELIVERY) {
            return "COD";
        }
        if (card == null) {
            throw new BusinessException("Card details are required for card payments");
        }
        String digits = card.number().replace(" ", "");
        if (digits.length() < 12 || digits.length() > 19 || !passesLuhn(digits)) {
            throw new BusinessException("The card number is not valid");
        }
        if (isExpired(card.expiry())) {
            throw new BusinessException("The card has expired");
        }
        if (digits.endsWith("0002")) {
            throw new BusinessException(HttpStatus.PAYMENT_REQUIRED, "Your card was declined");
        }
        return "CARD-" + digits.substring(digits.length() - 4);
    }

    static boolean passesLuhn(String digits) {
        int sum = 0;
        boolean doubleIt = false;
        for (int i = digits.length() - 1; i >= 0; i--) {
            int d = digits.charAt(i) - '0';
            if (d < 0 || d > 9) {
                return false;
            }
            if (doubleIt) {
                d *= 2;
                if (d > 9) {
                    d -= 9;
                }
            }
            sum += d;
            doubleIt = !doubleIt;
        }
        return sum % 10 == 0;
    }

    private static boolean isExpired(String mmYy) {
        int month = Integer.parseInt(mmYy.substring(0, 2));
        int year = 2000 + Integer.parseInt(mmYy.substring(3, 5));
        return YearMonth.of(year, month).isBefore(YearMonth.now());
    }
}
