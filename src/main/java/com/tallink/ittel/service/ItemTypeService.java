package com.tallink.ittel.service;

import com.tallink.ittel.Constants;
import com.tallink.ittel.ServiceNames;
import com.tallink.ittel.dao.ApplicationDAO;
import com.tallink.ittel.dao.model.domain.Item;
import com.tallink.ittel.dao.model.domain.ItemType;
import com.tallink.ittel.service.DefaultConfigService;
import org.apache.commons.collections.MapUtils;
import org.hibernate.SessionFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import java.util.Collection;
import java.util.HashMap;
import java.util.Map;

import static com.tallink.ittel.ComponentNames.LOCAL_SESSION_FACTORY;
import static com.tallink.ittel.Constants.description;
import static com.tallink.ittel.Constants.name;
import static com.tallink.ittel.Constants.needApprove;
import static com.tallink.ittel.ServiceNames.DEFAULT_CONFIG_SERVICE;

/**
 * Created by dmitrigu on 14.04.17.
 */
@Service(ServiceNames.ITEMTYPE_SERVICE)
public class ItemTypeService {

    @Resource(name = LOCAL_SESSION_FACTORY)
    private SessionFactory sessionFactory;

    @Autowired
    ApplicationDAO dao;

    @Autowired
    @Qualifier(DEFAULT_CONFIG_SERVICE)
    private DefaultConfigService configService;

    private static final Logger LOG = LoggerFactory.getLogger(ItemTypeService.class);

    public ItemTypeService() {
    }

    public ItemType saveItemType(Map data) {

        if (data == null) {
            return null;
        }

        ItemType item = new ItemType();
        item.setName((String) data.get(name.name()));
        LOG.info("save item type: " + item.getName());

        item.setDescription((String) data.get(description.name()));

        Integer objectKey = (Integer) dao.create(item);
        if (objectKey == null) return null;
        ItemType record = dao.fetch(objectKey, ItemType.class);
        return record;
    }


    public void updateItemType(Map data) {
        Integer id = (Integer) data.get(Constants.storageId.name());
        ItemType record = dao.fetch(id, ItemType.class);
        updateItemType(record, data);
    }

    private void updateItemType(ItemType item, Map data) {

        if (MapUtils.isEmpty(data)) {
            return;
        }
        LOG.info("updating item type: " + item.getName());
        item.setDescription((String) data.get(Constants.description.name()));
        item.setName((String) data.get(name.name()));

        dao.updateAndFlush(item);
    }


    public boolean deleteRecord(ItemType record) {
        LOG.info("Deleting record: " + record.getName());
        dao.delete(dao.fetch(record.getId(), ItemType.class));
        return true;
    }


    public Collection<ItemType> getTypes() {
        String query = "SELECT type from ItemType as type ORDER BY type.name";
        Map<String, Object> params = new HashMap<String, Object>();
        return dao.search(query, params);
    }


}
