
package br.com.economiabr.api.service;

import br.com.economiabr.api.client.IbgeClient;
import br.com.economiabr.api.dto.IpcaResponse;

import tools.jackson.databind.JsonNode;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

@Service
public class IpcaService {

    private final IbgeClient ibgeClient;

    public IpcaService(IbgeClient ibgeClient) {
        this.ibgeClient = ibgeClient;
    }

    public List<IpcaResponse> buscarHistorico(int meses) {

        JsonNode resposta = ibgeClient.buscarIpca(meses);

        List<IpcaResponse> historico = new ArrayList<>();

        JsonNode resultados = resposta.path(0)
                .path("resultados");

        if (!resultados.isArray() || resultados.isEmpty()) {
            throw new IllegalStateException(
                    "O IBGE não retornou dados para o IPCA."
            );
        }

        JsonNode series = resultados.get(0).path("series");

        if (!series.isArray() || series.isEmpty()) {
            throw new IllegalStateException(
                    "Não foi encontrada a série histórica do Brasil."
            );
        }

        JsonNode serie = series.get(0).path("serie");

        for (Map.Entry<String, JsonNode> campo : serie.properties()) {

            String periodo = campo.getKey();
            String valorOriginal = campo.getValue().asText();

            if (valorOriginal.equals("..")
                    || valorOriginal.isBlank()) {
                continue;
            }

            double valor = Double.parseDouble(
                    valorOriginal.replace(",", ".")
            );

            String periodoFormatado = periodo.substring(4, 6)
                    + "/" + periodo.substring(0, 4);

            historico.add(new IpcaResponse(
                    periodo,
                    periodoFormatado,
                    "IPCA - Variação mensal",
                    valor,
                    "%",
                    "IBGE/SIDRA - Tabela 1737"
            ));
        }

        historico.sort(Comparator.comparing(IpcaResponse::periodo));

        if (historico.size() > meses) {
            return new ArrayList<>(
                    historico.subList(historico.size() - meses, historico.size())
            );
        }

        return historico;
    }
}
