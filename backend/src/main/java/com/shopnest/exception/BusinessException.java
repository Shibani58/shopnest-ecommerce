package com.shopnest.exception;

import org.springframework.http.HttpStatus;

/** A rule of the shop was broken (out of stock, duplicate email, ...). Mapped to a 4xx response. */
public class BusinessException extends RuntimeException {

    private final HttpStatus status;

    public BusinessException(String message) {
        this(HttpStatus.BAD_REQUEST, message);
    }

    public BusinessException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
