package com.tallink.ittel.exceptions;


/**
 * Created by dmitrigu on 03.05.17.
 */
public class IttelException extends Exception {

    private static final long serialVersionUID = 1L;
    private String errorMessage;

    public String getErrorMessage() {
        return errorMessage;
    }

    public IttelException(String errorMessage) {
        super(errorMessage);
        this.errorMessage = errorMessage;
    }

    public IttelException() {
        super();
    }
}
