package org.libretools.oni2.rws;

import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;

import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;

/**
 * author: orelgenya
 * date: 05.06.13
 */
@Path("model")
public class ModelsService {

    @GET
    @Produces("application/json")
    public JSONObject test() {
        return model;
    }

    @GET
    @Path("collada")
    @Produces("application/json")
    public JSONObject testCollada() {
        return model;
    }

    private static final double[] vertices = new double[]{
            6.50000954, 0.399997354, 14.751339,
            -6.4999876, 0.399997354, 14.751339,
            -6.4999876, -0.400002182, 14.751339,
            6.50000954, -0.400002182, 14.751339,
            6.50000668, 0.3999973, -13.5,
            6.50000668, -0.400002241, -13.5,
            -6.49999046, -0.400002241, -13.5,
            -6.49999046, 0.3999973, -13.5,
            -5.409871, 0.399997443, -9.68894,
            -5.409871, 0.399997145, 12.467309,
            -5.409871, -0.4000024, 12.467309,
            -5.409871, -0.4000021, -9.688942,
            5.471526, 0.399997443, -9.68894,
            5.471526, -0.4000021, -9.688942,
            5.471526, -0.4000024, 12.467309,
            5.471526, 0.399997145, 12.467309
    };
    private static final double[] vertexIndexes = new double[]{
            9, 10, 11,
            15, 10, 9,
            0, 15, 9,
            4, 15, 0,
            5, 4, 0,
            6, 4, 5,
            11, 6, 5,
            10, 6, 11,
            11, 8, 9,
            13, 8, 11,
            5, 13, 11,
            3, 13, 5,
            0, 3, 5,
            1, 3, 0,
            9, 1, 0,
            8, 1, 9,
            15, 14, 10,
            10, 14, 2,
            10, 2, 6,
            6, 2, 7,
            6, 7, 4,
            4, 7, 12,
            4, 12, 15,
            15, 12, 14,
            14, 3, 2,
            13, 3, 14,
            12, 13, 14,
            8, 13, 12,
            7, 8, 12,
            1, 8, 7,
            2, 1, 7,
            3, 1, 2
    };
    private static final double[] textureCoords = new double[]{
            0.9995005, 0.9995005,
            0.000499755144, 0.9995005,
            0.000499755144, 0.9995005,
            0.999500453, 0.9995005,
            0.9995003, 0.0004994869,
            0.9995003, 0.0004994869,
            0.0004995167, 0.0004994869,
            0.0004995465, 0.0004994869,
            0.08190301, 0.135263145,
            0.08190301, 0.918734431,
            0.08190298, 0.918734431,
            0.08190298, 0.135263085,
            0.918097258, 0.135263145,
            0.918097258, 0.135263085,
            0.918097258, 0.918734431,
            0.918097258, 0.918734431
    };
    private static final JSONArray verticesJson = new JSONArray();
    private static final JSONArray vertexIndexesJson = new JSONArray();
    private static final JSONArray textureCoordsJson = new JSONArray();
    private static final JSONObject model = new JSONObject();
    static{
        try {
            for(double v : vertices) verticesJson.put(v);
            for(double v : vertexIndexes) vertexIndexesJson.put(v);
            for(double v : textureCoords) textureCoordsJson.put(v);
            model.put("vertices", verticesJson);
            model.put("verticesItemSize", 3);
            model.put("verticesNumItems", 16);
            model.put("vertexIndexes", vertexIndexesJson);
            model.put("vertexIndexesSize", 1);
            model.put("vertexIndexesNumItems", 96);
            model.put("textureCoords", textureCoordsJson);
            model.put("textureCoordsItemSize", 2);
            model.put("textureCoordsNumItems", 16);
        } catch (JSONException ex) {
            ex.printStackTrace();
        }
    }
}
