package com.tallink.ittel.service;

import com.sun.jersey.core.util.Base64;
import com.tallink.ittel.Constants;
import com.tallink.ittel.IttelStatus;
import com.tallink.ittel.ServiceNames;
import com.tallink.ittel.dao.ApplicationDAO;
import com.tallink.ittel.dao.model.domain.Item;
import com.tallink.ittel.dao.model.domain.ItemType;
import com.tallink.ittel.util.JsonUtils;
import com.tallink.ittel.web.api.JiraTicketResult;
import org.apache.commons.collections.MapUtils;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.codehaus.jackson.map.ObjectMapper;
import org.hibernate.SessionFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.annotation.Resource;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.Collection;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;

import static com.tallink.ittel.ComponentNames.LOCAL_SESSION_FACTORY;
import static com.tallink.ittel.ServiceNames.DEFAULT_CONFIG_SERVICE;

/**
 * Created by dmitrigu on 14.04.17.
 */
@Service(ServiceNames.ITEM_SERVICE)
public class ItemService {

    @Resource(name = LOCAL_SESSION_FACTORY)
    private SessionFactory sessionFactory;

    @Autowired
    ApplicationDAO dao;

    @Autowired
    @Qualifier(DEFAULT_CONFIG_SERVICE)
    private DefaultConfigService configService;

    private static final Logger LOG = LoggerFactory.getLogger(ItemService.class);

    public ItemService() {
    }

    public ItemType getType(Integer id) {

        try {
            ItemType type = dao.fetch(id, ItemType.class);
            return type;
        } catch (Exception e) {
            LOG.error("Unable to get type");
            return null;
        }
    }

    public Item saveItem(Map data) {

        if (data == null) {
            return null;
        }
        LOG.info("Save Item : " + (String) data.get(Constants.name.name()));
        Integer typeId = (Integer) data.get(Constants.typeId.name());
        ItemType type = getType(typeId);
        Item item = new Item();
        item.setType(type);
        item.setName((String) data.get(Constants.name.name()));
        item.setDescription((String) data.get(Constants.description.name()));
        item.setNeedApprove((Boolean) data.get(Constants.needApprove.name()));

        Integer objectKey = (Integer) dao.create(item);
        if (objectKey == null) return null;
        Item record = dao.fetch(objectKey, Item.class);
        return record;
    }


    public void updateItem(Map data) {
        Integer id = (Integer) data.get(Constants.storageId.name());
        Item record = dao.fetch(id, Item.class);
        updateItem(record, data);
    }

    private void updateItem(Item item, Map data) {

        if (MapUtils.isEmpty(data)) {
            return;
        }
        LOG.info("updating Item record " + item.getName());
        item.setDescription((String) data.get(Constants.description.name()));
        item.setName((String) data.get(Constants.name.name()));
        item.setNeedApprove((Boolean) data.get(Constants.needApprove.name()));

        dao.updateAndFlush(item);
    }


    public boolean deleteRecord(Item record) {
        LOG.info("Deleting ITTEL record " + record.getName());
        dao.delete(record);
        return true;
    }


    public Collection<Item> getItems() {

        String query = "SELECT item from Item as item ORDER BY item.name";
        Map<String, Object> params = new HashMap<String, Object>();
        return dao.search(query, params);
    }

    @Transactional
    public Collection<Item> getItemsByType(Integer id) {

        Map<String, Object> params = new HashMap<String, Object>();
        String query = "SELECT item from Item as item ";
        query += "WHERE item.type.id = :id ORDER BY item.name";
        params.put("id", id);
        Collection items = dao.search(query, params);
        return items;

    }


    static String executePost(String targetURL, String username, String password, String data) {

        CloseableHttpClient httpClient = HttpClients.createDefault();

        CloseableHttpResponse httpResponse = null;
        try {
            HttpPost request = new HttpPost(targetURL);
            StringEntity params = null;

            request.addHeader("content-type", "application/json");

            String auth = new String(Base64.encode(username + ":" + password));
            params = new StringEntity(data.toString());

            request.addHeader("Authorization", "Basic " + auth);

            //request.addHeader("cookies", "JSESSIONID=EA827E33EDE99AF7AAE7766D070A133C; atlassian.xsrf.token=B2Y8-F718-JDZE-SJRG|8782b50f4b30e542a53dc94e9fc35f128e098b10|lin; JSESSIONID=71B070204C491AFBF7F65BCC05F4B896; atlassian.xsrf.token=B2Y8-F718-JDZE-SJRG|7a6ad3a9f4cc964bc7454532b5b4e2d165ff8766|lin; JSESSIONID=EA827E33EDE99AF7AAE7766D070A133C; atlassian.xsrf.token=B2Y8-F718-JDZE-SJRG|8782b50f4b30e542a53dc94e9fc35f128e098b10|lin; jira.editor.user.mode=source; JSESSIONID=71B070204C491AFBF7F65BCC05F4B896; atlassian.xsrf.token=B2Y8-F718-JDZE-SJRG|7a6ad3a9f4cc964bc7454532b5b4e2d165ff8766|lin; JSESSIONID=EA827E33EDE99AF7AAE7766D070A133C; atlassian.xsrf.token=B2Y8-F718-JDZE-SJRG|8782b50f4b30e542a53dc94e9fc35f128e098b10|lin; jira.editor.user.mode=source; JSESSIONID=71B070204C491AFBF7F65BCC05F4B896; atlassian.xsrf.token=B2Y8-F718-JDZE-SJRG|7a6ad3a9f4cc964bc7454532b5b4e2d165ff8766|lin; JSESSIONID=EA827E33EDE99AF7AAE7766D070A133C; atlassian.xsrf.token=B2Y8-F718-JDZE-SJRG|8782b50f4b30e542a53dc94e9fc35f128e098b10|lin; jira.editor.user.mode=source; JSESSIONID=71B070204C491AFBF7F65BCC05F4B896; atlassian.xsrf.token=B2Y8-F718-JDZE-SJRG|7a6ad3a9f4cc964bc7454532b5b4e2d165ff8766|lin; JSESSIONID=EA827E33EDE99AF7AAE7766D070A133C; atlassian.xsrf.token=B2Y8-F718-JDZE-SJRG|8782b50f4b30e542a53dc94e9fc35f128e098b10|lin; jira.editor.user.mode=source; JSESSIONID=71B070204C491AFBF7F65BCC05F4B896; atlassian.xsrf.token=B2Y8-F718-JDZE-SJRG|7a6ad3a9f4cc964bc7454532b5b4e2d165ff8766|lin; JSESSIONID=EA827E33EDE99AF7AAE7766D070A133C; atlassian.xsrf.token=B2Y8-F718-JDZE-SJRG|8782b50f4b30e542a53dc94e9fc35f128e098b10|lin; jira.editor.user.mode=source; JSESSIONID=71B070204C491AFBF7F65BCC05F4B896; atlassian.xsrf.token=B2Y8-F718-JDZE-SJRG|7a6ad3a9f4cc964bc7454532b5b4e2d165ff8766|lin; JSESSIONID=EA827E33EDE99AF7AAE7766D070A133C; atlassian.xsrf.token=B2Y8-F718-JDZE-SJRG|8782b50f4b30e542a53dc94e9fc35f128e098b10|lin; jira.editor.user.mode=source; JSESSIONID=71B070204C491AFBF7F65BCC05F4B896; atlassian.xsrf.token=B2Y8-F718-JDZE-SJRG|7a6ad3a9f4cc964bc7454532b5b4e2d165ff8766|lin");

            request.setEntity(params);
            httpResponse = httpClient.execute(request);

            if (httpResponse == null || httpResponse.getEntity() == null) {
                return null;
            }

            BufferedReader reader = new BufferedReader(new InputStreamReader(
                    httpResponse.getEntity().getContent()));

            String inputLine;
            StringBuffer response = new StringBuffer();

            while ((inputLine = reader.readLine()) != null) {
                response.append(inputLine);
            }
            reader.close();
            // print result
            System.out.println(response.toString());

            return response.toString();


// handle response here...
        } catch (Exception ex) {
            ex.printStackTrace();

        } finally {
            try {
                httpClient.close();
                httpResponse.close();
            } catch (Exception e) {

            }
        }
        return null;
    }



    public Map sendJiraPost(String targetURL, String username, String password, String data) throws Exception{

        try {
            String result = executePost(targetURL, username,
                    password, data);

            if (result == null) {
                return null;
            } else if (result.contains("Unauthorized")) {
                throw new Exception("Not authorized");

            } else {

                return processResultData(result);
            }
        } catch (Exception e) {
            throw e;
        }
    }

    private static Map processResultData(String result){

        Map res = null;
        try {
            res = new ObjectMapper().readValue(result, HashMap.class);
        } catch (Exception e) {
            LOG.error(e.getMessage());
        }
        return res;

    }

}
