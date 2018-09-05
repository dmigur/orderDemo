package com.tallink.ittel.util;

import com.google.gson.GsonBuilder;
import org.apache.commons.collections.CollectionUtils;
import org.slf4j.Logger;

import java.util.Collection;

import static com.google.common.collect.Lists.newArrayList;
import static org.apache.commons.lang.StringUtils.isNotBlank;
import static org.slf4j.LoggerFactory.getLogger;

/**
 * Created by dmitrigu on 12.09.16.
 */
public class JsonUtils {

    private static final Logger LOG = getLogger(JsonUtils.class);

    public static String toJson(Collection<Object> source) {
        String json = null;
        if (CollectionUtils.isEmpty(source)) return json;

        try {
            Collection<Object> jsonSource = newArrayList();
            for (Object object : source) {
                String jsonObject = toJson(object);
                if (jsonObject == null) continue;

                jsonSource.add(object);
            }

            if (CollectionUtils.isEmpty(jsonSource)) return json;
            return new GsonBuilder().create().toJson(jsonSource);
        } catch (Exception | StackOverflowError ex) {
            if (LOG.isWarnEnabled()) LOG.warn("While trying to serialize composite object to json!");
        }

        return json;
    }

    public static String toJson(Object source) {
        String json = null;
        if (source == null) return json;

        try {
            if (source instanceof Exception) {
                Exception ex = (Exception) source;

                String exceptionMessage;
                if (isNotBlank(ex.getLocalizedMessage())) exceptionMessage = ex.getLocalizedMessage();
                else exceptionMessage = ex.getMessage();

                return new GsonBuilder().create().toJson(exceptionMessage);
            }

            return new GsonBuilder().create().toJson(source);
        } catch (Exception | StackOverflowError ex) {
            if (LOG.isWarnEnabled()) LOG.warn("While trying to serialize composite object to json!");
        }

        return json;
    }
}
