/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package com.pointofviewsoftware.touch.server;

import ProgramWritter.DataModelUpdatableGettableByField;
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
            System.err.println("Touch Model Name:" + modelName);
            WinkModelMapping mapping = null;
            for (WinkModelMapping map : WinkModelMapping.mapping) {
                System.err.println(map.touchModelName + " vs " + modelName);
                if (map.touchModelName.equals(modelName)) {
                    mapping = map;
                    break;
                }
            }

            if (mapping == null) {
                String redirect = request.getRequestURI().replace("/model/", "/model-static/");
                System.err.println("Wink Model Mapping not Found for " + modelName);
                System.err.println("redirecting to :" + redirect);
                response.sendRedirect(redirect);

                return;
            }
            System.err.println("Wink Model Mapping - for " + modelName + " is  " + mapping.className);

            out.println("Ext.define('WINK.model." + modelName + "', {\n"
                    + "    extend: 'Ext.data.Model',\n"
                    + "\n"
                    + "    requires: [\n"
                    + "        'Ext.data.Field'\n"
                    + "    ],\n"
                    + "\n"
                    + "    config: {\n"
                    + "        fields: [\n");

            boolean isFirst = true;

            DataModelUpdatableGettableByField model = ((DataModelUpdatableGettableByField) Thread.currentThread().getContextClassLoader().loadClass(mapping.className).newInstance());

            List<String> fieldsNotToSend = RestModelFieldsNotToSend.getForClassName(model.getClass().getName());

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
                            + " name: '" + fieldName.toLowerCase() + "'"
                            + "}");

                    isFirst = false;
                }
            }

            out.println("        ]\n"
                    + "    }\n"
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
