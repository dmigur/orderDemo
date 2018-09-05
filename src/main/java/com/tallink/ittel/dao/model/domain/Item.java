package com.tallink.ittel.dao.model.domain;

import org.hibernate.annotations.Cascade;

import javax.persistence.*;
import javax.validation.constraints.NotNull;
import java.util.Calendar;

import static com.tallink.ittel.DatabaseTableNames.ITTEL_ITEM;
import static javax.persistence.FetchType.EAGER;
import static javax.persistence.FetchType.LAZY;
import static javax.persistence.GenerationType.AUTO;
import static org.hibernate.annotations.CascadeType.DELETE;
import static org.hibernate.annotations.CascadeType.MERGE;
import static org.hibernate.annotations.CascadeType.SAVE_UPDATE;

/**
 * Created by dmitrigu on 14.04.17.
 */
@Entity
@Table(name = ITTEL_ITEM)
public class Item {

    @Id
    @GeneratedValue(strategy = AUTO)
    private Integer id;

    @Column(name = "name")
    private String name;

    @Column(name = "description")
    private String description;

    @Column(name = "need_approve")
    private Boolean needApprove;

    //@NotNull
    @ManyToOne(fetch = EAGER)
    @Cascade(value = {MERGE, SAVE_UPDATE })
    @JoinColumn(name = "type_id", updatable = false)
    private ItemType type;

    public ItemType getType() {
        return type;
    }

    public void setType(ItemType type) {
        this.type = type;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public boolean isNeedApprove() {
        return needApprove;
    }

    public void setNeedApprove(boolean needApprove) {
      this.needApprove = needApprove;
    }
}
