/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package com.pointofviewsoftware.touch.server;

import com.pointofviewsoftware.server.WinkModelMapping;
import ProgramWritter.DataModelUpdatableGettableByField;
import ProgramWritter.ProgramWritterField;
import ProgramWritter.client.myGWTDate;
import com.pointofviewsoftware.mypov.common.RestModelFieldsNotToSend;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/**
 *
 * @author Christian
 */
public class WinkModelServlet extends HttpServlet {

    /**
     * Processes requests for both HTTP <code>GET</code> and <code>POST</code>
     * methods.
     *
     * @param request servlet request
     * @param response servlet response
     * @throws ServletException if a servlet-specific error occurs
     * @throws IOException if an I/O error occurs
     */
    protected void processRequest(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("text/javascript;charset=UTF-8");
        PrintWriter out = response.getWriter();
        try {

            String modelName = request.getRequestURI();
            System.err.println("pathInfo:" + modelName);

            modelName = modelName.substring(modelName.lastIndexOf("/") + 1, modelName.lastIndexOf("."));
            //System.err.println("Touch Model Name:" + modelName);
            WinkModelMapping mapping = null;
            for (WinkModelMapping map : WinkModelMapping.mapping) {
                // System.err.println(map.getTouchModelName() + " vs " + modelName);
                if (map.getTouchModelName().equals(modelName)) {
                    mapping = map;
                    break;
                }
            }

            if (mapping == null) {
                String redirect = request.getRequestURI().replace("/model/", "/model-static/");
                //System.err.println("Wink Model Mapping not Found for " + modelName);
                //System.err.println("redirecting to :" + redirect);
                response.sendRedirect(redirect);

                return;
            }

            //System.err.println("Wink Model Mapping - for " + modelName + " is  " + mapping.getClassName());
            DataModelUpdatableGettableByField model = ((DataModelUpdatableGettableByField) Thread.currentThread().getContextClassLoader().loadClass(mapping.getClassName()).newInstance());

            List<String> fieldsNotToSend = RestModelFieldsNotToSend.getForClassName(model.getClass().getName());

            String restURL = mapping.getRestUrl();

            out.println("Ext.define('WINK.model." + modelName + "',{\n"
                    + "extend: 'Ext.data.Model',\n"
                    + "requires: [\n"
                    + "'Ext.data.Field',\n"
                    + "'Ext.data.association.HasMany',\n"
                    + "'Ext.data.association.HasOne',\n"
                    + "'Ext.data.association.BelongsTo',\n"
                    + "'WINK.Utilities'\n");
            out.println("        ,'Ext.data.proxy.Rest'\n");

            out.println("    ],\n"
                    + "\n"
                    + "    config: {\n");

            if ((restURL != null) && (restURL.trim().length() > 0)) {
                out.println("proxy: {\n"
                        + "    type: 'rest',\n"
                        + "    url: WINK.Utilities.getRestURL() + '" + restURL + "',\n"
                        + "            withCredentials: true,\n"
                        + "            useDefaultXhrHeader: false,\n"
                        + "            cors: true"
                        + "  },");
            }

            out.println("        fields: [\n");

            boolean isFirst = true;

            for (String fieldName : model.getAllFieldNames()) {

                boolean add = true;
                if (fieldsNotToSend != null) {
                    for (String notToSend : fieldsNotToSend) {
                        if (notToSend.equalsIgnoreCase(fieldName)) {
                            add = false;
                            break;
                        }
                    }
                }

                if (add) {

                    if (!isFirst) {
                        out.println(",");
                    }

                    out.println("{"
                            + " name: '" + mapping.getRestFieldName(model, fieldName) + "'");
                    if (mapping.isDateField(model, fieldName)) { //always check date before checking long
                        out.println(", type:'date'");
                    } else if (model.getFieldType(fieldName) == ProgramWritterField.INT) {
                        out.println(", type:'int'");
                    } else if (model.getFieldType(fieldName) == ProgramWritterField.STRING) {
                        out.println(", type:'string'");
                    } else if (model.getFieldType(fieldName) == ProgramWritterField.LONG) {
                        out.println(", type:'string'");
                    } else if (model.getFieldType(fieldName) == ProgramWritterField.BOOLEAN) {
                        out.println(", type:'boolean'");
                    } else if (model.getFieldType(fieldName) == ProgramWritterField.DOUBLE) {
                        out.println(", type:'float'");
                        
                    } else if (model.getFieldType(fieldName) == ProgramWritterField.BYTE_ARRAY) {
                        out.println(", type:'string'");
                        
                    } else {

                    }

                    //if (mapping.isPrintDefaults()) {
                    out.print(" ,defaultValue: ");
                    if (mapping.isDateField(model, fieldName)) {
                        if (model.isNull(fieldName)) {
                            out.println("null");
                        } else {
                            myGWTDate d = model.getDate(fieldName);
                            if ((d == null) || (d.isNull())) {
                                out.println("null");
                            } else {
                                if (mapping.isDateFieldLong(model, fieldName)) {
                                    out.println("new Date(" + d.getDate() + ")");
                                } else {
                                    out.println("new Date(" + d.getYear() + "," + (d.getMonth_1_to_12() - 1) + "," + d.getDay() + "," + d.getHourOfDay() + "," + d.getMinute() + "," + d.getSecond() + ")");
                                }
                            }
                        }
                    } else if (model.getFieldType(fieldName) == ProgramWritterField.INT) {
                        if (model.getInt(fieldName) == 0) {
                            if (model.isFK(fieldName) || model.getKeyFieldName().equalsIgnoreCase(fieldName)) {
                                out.println("null");
                            } else {
                                out.println("0");
                            }
                        } else {
                            out.println(model.getInt(fieldName));
                        }
                    } else if (model.getFieldType(fieldName) == ProgramWritterField.STRING) {
                        if (model.isNull(fieldName)) {
                            out.println("''");
                        } else {
                            out.println("\"" + model.getString(fieldName) + "\"");
                        }

                    } else if (model.getFieldType(fieldName) == ProgramWritterField.LONG) {
                        if (model.getLong(fieldName) == 0) {
                            if (model.isFK(fieldName) || model.getKeyFieldName().equalsIgnoreCase(fieldName)) {
                                out.println("null");
                            } else {
                                out.println("0");
                            }
                        } else {
                            out.println(model.getLong(fieldName));
                        }

                    } else if (model.getFieldType(fieldName) == ProgramWritterField.BOOLEAN) {

                        out.println("" + model.getBoolean(fieldName) + "");

                    } else if (model.getFieldType(fieldName) == ProgramWritterField.DOUBLE) {
                        out.println(model.getDouble(fieldName));
                    } else {
                        if (model.isNull(fieldName)) {
                            out.println("null");
                        } else {
                            out.println("\"" + model.getStringValue(fieldName) + "\"");
                        }
                    }
                    // }

                    out.println("}");

                    isFirst = false;
                }
            }

            out.println("        ]\n");

            {
                //belongs to

                out.println(" ,belongsTo: [\n");
                isFirst = true;
                for (String fieldName : model.getAllFieldNames()) {

                    boolean add = true;
                    if (fieldsNotToSend != null) {
                        for (String notToSend : fieldsNotToSend) {
                            if (notToSend.equalsIgnoreCase(fieldName)) {
                                add = false;
                                break;
                            }
                        }
                    }

                    if (add) {

                        if (model.isFK(fieldName)) {

                            String referencedClass = model.getForeignKeyTableName(fieldName);
                            WinkModelMapping foreignMapping = WinkModelMapping.getForClassName(referencedClass);
                            if (foreignMapping != null) {
                                if (!isFirst) {
                                    out.println(",");
                                }

                                String restFieldName = mapping.getRestFieldName(model, fieldName);

                                out.println("            {\n"
                                        + "                model: 'WINK.model." + foreignMapping.getTouchModelName() + "',\n"
                                        + "                associatedName: 'fk" + restFieldName + "',\n"
                                        + "                foreignKey: '" + restFieldName + "',\n"
                                        + "                primaryKey: 'id',\n"
                                        + "                getterName: 'getFk" + restFieldName + "',\n"
                                        + "                setterName: 'setFk" + restFieldName + "'\n"
                                        + "            }\n");
                                isFirst = false;
                            }
                        }
                    }
                }

                out.println("        ] ");
            }
            {
                //belongs to

                out.println(" ,hasMany: [\n");
                isFirst = true;

                //We are looking for any classes that references this model class
                for (WinkModelMapping foreignMapping : WinkModelMapping.mapping) {
                    DataModelUpdatableGettableByField fkModel = (DataModelUpdatableGettableByField) Thread.currentThread().getContextClassLoader().loadClass(foreignMapping.getClassName()).newInstance();

                    List<String> fkFieldsNotToSend = RestModelFieldsNotToSend.getForClassName(fkModel.getClass().getName());

                    for (String fkFieldName : fkModel.getAllFieldNames()) {

                        boolean add = true;
                        if (fkFieldsNotToSend != null) {
                            for (String notToSend : fkFieldsNotToSend) {
                                if (notToSend.equalsIgnoreCase(fkFieldName)) {
                                    add = false;
                                    break;
                                }
                            }
                        }

                        if (add) {

                            if (fkModel.isFK(fkFieldName)) {

                                if (fkModel.getForeignKeyTableName(fkFieldName).equalsIgnoreCase(model.getClass().getName())) {
                                    if (!isFirst) {
                                        out.println(",");
                                    }

                                    String foreignTable_foreinkKeyName = foreignMapping.getRestFieldName(fkModel, fkFieldName);
                                    String restFieldName = foreignMapping.getTouchModelName().toLowerCase() + "s_" + foreignTable_foreinkKeyName;

                                    out.println("            {\n"
                                            + "                model: 'WINK.model." + foreignMapping.getTouchModelName() + "',\n"
                                            + "                name: '" + restFieldName + "',\n"
                                            + "                foreignKey: '" + foreignTable_foreinkKeyName + "',\n"
                                            + "                associationKey: '" + restFieldName + "',\n"
                                            + "                primaryKey: 'id'\n"
                                            + "            }\n");
                                    isFirst = false;
                                }
                            }
                        }
                    }
                }

                out.println("        ] ");
            }
            {
                out.println(",validations: [");
                isFirst = true;
                for (String fieldName : model.getAllFieldNames()) {
                    boolean add = true;
                    if (fieldsNotToSend != null) {
                        for (String notToSend : fieldsNotToSend) {
                            if (notToSend.equalsIgnoreCase(fieldName)) {
                                add = false;
                                break;
                            }
                        }
                    }

                    if (add) {

                        if (model.getFieldType(fieldName) == ProgramWritterField.STRING) {
                            int max = model.getMaximumNumberOfCharacters(fieldName);
                            if (max > 0) {
                                if (!isFirst) {
                                    out.println(",");
                                }
                                String restField = mapping.getRestFieldName(model, fieldName);
                                out.println(" { type: 'length', field: '" + restField + "', max: " + max + ",min:0 }");
                                isFirst = false;
                            }
                        }
                    }
                }

                out.println("]    ");
            }
            out.println("}\n"
                    + "});");
        } catch (Error ex) {
            ex.printStackTrace();
        } catch (Exception ex) {
            ex.printStackTrace();
        } finally {
            out.close();
        }
    }

    // <editor-fold defaultstate="collapsed" desc="HttpServlet methods. Click on the + sign on the left to edit the code.">
    /**
     * Handles the HTTP <code>GET</code> method.
     *
     * @param request servlet request
     * @param response servlet response
     * @throws ServletException if a servlet-specific error occurs
     * @throws IOException if an I/O error occurs
     */
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        processRequest(request, response);
    }

    /**
     * Handles the HTTP <code>POST</code> method.
     *
     * @param request servlet request
     * @param response servlet response
     * @throws ServletException if a servlet-specific error occurs
     * @throws IOException if an I/O error occurs
     */
    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        processRequest(request, response);
    }

    /**
     * Returns a short description of the servlet.
     *
     * @return a String containing servlet description
     */
    @Override
    public String getServletInfo() {
        return "Short description";
    }// </editor-fold>

}
