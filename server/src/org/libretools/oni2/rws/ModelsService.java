package org.libretools.oni2.rws;

import javax.ws.rs.GET;
import javax.ws.rs.Path;

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
    public JSONObject test() {
        return model;
    }

    private static final double[] vertices = new double[]{
            // front
            -1.0,   -1.0,   1.0,
            1.0,    -1.0,   1.0,
            1.0,    1.0,    1.0,
            -1.0,   1.0,    1.0,
            // back
            -1.0,   -1.0,   -1.0,
            -1.0,   1.0,    -1.0,
            1.0,    1.0,    -1.0,
            1.0,    -1.0,   -1.0,
            // top
            -1.0,   1.0,    -1.0,
            -1.0,   1.0,    1.0,
            1.0,    1.0,    1.0,
            1.0,    1.0,    -1.0,
            // bottom
            -1.0,   -1.0,   -1.0,
            1.0,    -1.0,   -1.0,
            1.0,    -1.0,   1.0,
            -1.0,   -1.0,   1.0,
            // right
            1.0,    -1.0,   -1.0,
            1.0,    1.0,    -1.0,
            1.0,    1.0,    1.0,
            1.0,    -1.0,   1.0,
            // left
            -1.0,   -1.0,   -1.0,
            -1.0,   -1.0,   1.0,
            -1.0,   1.0,    1.0,
            -1.0,   1.0,    -1.0
    };
    private static final double[] vertexIndexes = new double[]{
            0,1,2, 0,2,3,       // front
            4,5,6, 4,6,7,       // back
            8,9,10, 8,10,11,    // top
            12,13,14, 12,14,15, // bottom
            16,17,18, 16,18,19, // right
            20,21,22, 20,22,23  // left
    };
    private static final double[] textureCoords = new double[]{
            // front
            0.0, 0.0,
            1.0, 0.0,
            1.0, 1.0,
            0.0, 1.0,
            // back
            1.0, 0.0,
            1.0, 1.0,
            0.0, 1.0,
            0.0, 0.0,
            // top
            0.0, 1.0,
            0.0, 0.0,
            1.0, 0.0,
            1.0, 1.0,
            // bottom
            1.0, 1.0,
            0.0, 1.0,
            0.0, 0.0,
            1.0, 0.0,
            // right
            1.0, 0.0,
            1.0, 1.0,
            0.0, 1.0,
            0.0, 0.0,
            // left
            0.0, 0.0,
            1.0, 0.0,
            1.0, 1.0,
            0.0, 1.0
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
            model.put("vertexIndexes", vertexIndexesJson);
            model.put("textureCoords", textureCoordsJson);
        } catch (JSONException ex) {
            ex.printStackTrace();
        }
    }
}
