package com.tallink.ittel.util;

import com.tallink.ittel.Constants;

import java.text.SimpleDateFormat;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.regex.Pattern;

/**
 * Created by dmitrigu on 19.04.17.
 */
public class DateUtils {

    public static Calendar from(String isoDate) {
        try {
            if (isoDate == null) {
                return null;
            }
            DateTimeFormatter f = DateTimeFormatter.ISO_ZONED_DATE_TIME.withZone(ZoneId.systemDefault());
            ZonedDateTime zdt = ZonedDateTime.parse(isoDate, f);
            return GregorianCalendar.from(zdt);
        } catch (Exception e) {
        }
        try {
            SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd");
            Date date = format.parse(isoDate);
            GregorianCalendar calendar = new GregorianCalendar();
            calendar.setTime(date);
            return calendar;
        } catch (Exception e) {
        }
        try {
            SimpleDateFormat format = new SimpleDateFormat("dd.MM.yyyy");
            Date date = format.parse(isoDate);
            GregorianCalendar calendar = new GregorianCalendar();
            calendar.setTime(date);
            return calendar;
        } catch (Exception e) {
        }

        return null;
    }

    public static Calendar from(Long date) {
        if (date == null) {
            return null;
        }
        Calendar calendar = Calendar.getInstance();
        calendar.setTimeInMillis(date);
        return calendar;
    }

    public static long diffDays(Calendar cal1, Calendar cal2) {
        return ChronoUnit.DAYS.between(cal1.toInstant(), cal2.toInstant());
    }

    public static String getJiraErrors(Map errors) {

        String errorMessage = "";
        if (errors != null) {
            Iterator it = errors.keySet().iterator();
            while (it.hasNext()) {
                String errorKey = (String) it.next();
                String meessage = (String) errors.get(errorKey);
                if (errorMessage.length() != 0) {
                    errorMessage += ",";
                }
                errorMessage += errorKey + ": " + meessage;
            }

        }
        return errorMessage;
    }
}