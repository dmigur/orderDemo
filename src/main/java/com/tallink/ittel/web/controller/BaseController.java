package com.tallink.ittel.web.controller;

import com.tallink.ittel.bean.ErrorResponse;
import org.slf4j.Logger;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.ResponseStatus;

import static org.slf4j.LoggerFactory.getLogger;
import static org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE;

/**
 * Created by dmitrigu on 21.09.16.
 */

public class BaseController {

	private static final Logger LOG = getLogger(BaseController.class);

	@ExceptionHandler(Exception.class)
	@ResponseStatus(SERVICE_UNAVAILABLE)
	@ResponseBody
	public Object handle(Exception ex) {
		if (LOG.isErrorEnabled()) LOG.error("While trying to process request", ex);

		ErrorResponse error = new ErrorResponse();
		error.setErrorCode(HttpStatus.BAD_REQUEST.value());
		error.setMessage(ex.getMessage());
		return new ResponseEntity<ErrorResponse>(error, HttpStatus.SERVICE_UNAVAILABLE);

	}

}
